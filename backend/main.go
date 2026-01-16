package main

import (
	"my-blog-backend/config"
	"my-blog-backend/routes"
	"time"

	"github.com/gin-contrib/cors"
)

func main() {
	// 连接数据库
	config.ConnectDB()

	// 设置路由
	r := routes.SetupRouter()

	// 配置CORS，允许前端跨域访问
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 启动服务
	r.Run(":8080")
}
