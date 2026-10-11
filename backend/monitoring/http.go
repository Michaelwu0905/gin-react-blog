package monitoring

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// HTTPMetrics owns a registry so constructing multiple routers is safe.
type HTTPMetrics struct {
	registry *prometheus.Registry
	requests *prometheus.CounterVec
	duration *prometheus.HistogramVec
	inFlight prometheus.Gauge
}

func NewHTTPMetrics() *HTTPMetrics {
	m := &HTTPMetrics{
		registry: prometheus.NewRegistry(),
		requests: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "blog_http_requests_total",
			Help: "Total completed HTTP requests, excluding the metrics endpoint.",
		}, []string{"method", "route", "status"}),
		duration: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "blog_http_request_duration_seconds",
			Help:    "HTTP request duration in seconds, excluding the metrics endpoint.",
			Buckets: []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
		}, []string{"method", "route"}),
		inFlight: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "blog_http_requests_in_flight",
			Help: "HTTP requests currently being handled, excluding the metrics endpoint.",
		}),
	}
	m.registry.MustRegister(m.requests, m.duration, m.inFlight,
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}))
	return m
}

func (m *HTTPMetrics) Handler() http.Handler {
	return promhttp.HandlerFor(m.registry, promhttp.HandlerOpts{})
}

// Middleware must wrap Gin Recovery so recovered panics are counted as 500s.
func (m *HTTPMetrics) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.FullPath() == "/metrics" {
			c.Next()
			return
		}

		start := time.Now()
		m.inFlight.Inc()
		defer m.inFlight.Dec()
		c.Next()

		// Use route templates, never article IDs or raw unmatched URLs.
		route := c.FullPath()
		if route == "" {
			route = "unmatched"
		}
		method := c.Request.Method
		switch method {
		case http.MethodGet, http.MethodHead, http.MethodPost, http.MethodPut,
			http.MethodPatch, http.MethodDelete, http.MethodConnect,
			http.MethodOptions, http.MethodTrace:
		default:
			method = "OTHER"
		}
		m.requests.WithLabelValues(method, route, strconv.Itoa(c.Writer.Status())).Inc()
		m.duration.WithLabelValues(method, route).Observe(time.Since(start).Seconds())
	}
}
