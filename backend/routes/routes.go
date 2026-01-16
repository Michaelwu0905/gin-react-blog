package routes

import (
	"my-blog-backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// 简单的健康检查接口
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	api := r.Group("api")
	{
		api.GET("/posts", controllers.GetPosts)
		api.POST("/posts", controllers.CreatePost)
		api.GET("/posts/:id", controllers.GetPostById)
	}
	return r
}
