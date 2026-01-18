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

	// 配置静态文件服务，用于访问上传的图片
	r.Static("/uploads", "./uploads")

	api := r.Group("api")
	{
		api.GET("/posts", controllers.GetPosts)
		api.POST("/posts", controllers.CreatePost)
		api.GET("/posts/:id", controllers.GetPostById)
		// 图片上传接口
		api.POST("/upload", controllers.UploadImage)
	}
	return r
}
