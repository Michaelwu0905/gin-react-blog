package controllers

import (
	"context"
	"my-blog-backend/config"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Ready checks the database as well as the HTTP process.
func Ready(c *gin.Context) {
	if config.DB == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"ready": false})
		return
	}
	db, err := config.DB.DB()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"ready": false})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"ready": false})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ready": true})
}
