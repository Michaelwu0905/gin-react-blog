package routes

import (
	"my-blog-backend/controllers"
	"my-blog-backend/middleware"

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
		// 认证相关路由（公开）
		auth := api.Group("/auth")
		{
			auth.POST("/register", controllers.Register)
			auth.POST("/login", controllers.Login)
			auth.GET("/me", middleware.AuthRequired(), controllers.GetMe)
		}

		// 文章相关路由
		// 公开接口
		api.GET("/posts", controllers.GetPosts)
		api.GET("/posts/:id", controllers.GetPostById)

		// 需要认证的接口
		authPosts := api.Group("/posts")
		authPosts.Use(middleware.AuthRequired())
		{
			authPosts.POST("", controllers.CreatePost)
			authPosts.PUT("/:id", controllers.UpdatePost)
			authPosts.DELETE("/:id", controllers.DeletePost)
		}

		// 获取当前用户的文章
		api.GET("/my-posts", middleware.AuthRequired(), controllers.GetMyPosts)

		// 图片上传接口（需要认证）
		api.POST("/upload", middleware.AuthRequired(), controllers.UploadImage)
	}

	return r
}
