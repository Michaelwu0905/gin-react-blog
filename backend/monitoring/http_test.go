package monitoring

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHTTPMetrics(t *testing.T) {
	gin.SetMode(gin.TestMode)
	metrics := NewHTTPMetrics()
	r := gin.New()
	r.Use(metrics.Middleware(), gin.RecoveryWithWriter(io.Discard))
	r.GET("/metrics", gin.WrapH(metrics.Handler()))
	r.GET("/posts/:id", func(c *gin.Context) { c.Status(http.StatusOK) })
	r.GET("/private", func(c *gin.Context) { c.AbortWithStatus(http.StatusUnauthorized) })
	r.GET("/panic", func(c *gin.Context) { panic("test recovery") })

	for _, path := range []string{"/posts/1", "/posts/2", "/private", "/panic", "/unknown/1", "/unknown/2", "/metrics"} {
		r.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, path, nil))
	}

	families, err := metrics.registry.Gather()
	if err != nil {
		t.Fatal(err)
	}
	expected := map[string]float64{
		"/posts/:id:200": 2,
		"/private:401":   1,
		"/panic:500":     1,
		"unmatched:404":  2,
	}
	var requestSeries, durationSamples int
	for _, family := range families {
		for _, metric := range family.Metric {
			switch family.GetName() {
			case "blog_http_requests_total":
				labels := map[string]string{}
				for _, label := range metric.Label {
					labels[label.GetName()] = label.GetValue()
				}
				key := labels["route"] + ":" + labels["status"]
				want, ok := expected[key]
				if !ok || metric.Counter.GetValue() != want || labels["method"] != "GET" {
					t.Errorf("unexpected request metric: %s = %v", key, metric.Counter.GetValue())
				}
				requestSeries++
			case "blog_http_request_duration_seconds":
				durationSamples += int(metric.Histogram.GetSampleCount())
			case "blog_http_requests_in_flight":
				if metric.Gauge.GetValue() != 0 {
					t.Error("in-flight requests did not return to zero")
				}
			}
		}
	}
	if requestSeries != len(expected) || durationSamples != 6 {
		t.Fatalf("got %d request series and %d duration samples", requestSeries, durationSamples)
	}
}
