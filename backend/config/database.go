package config

import (
	"fmt"
	"log"
	"my-blog-backend/models"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	// 从环境变量中国获取配置，若不存在则使用默认值
	dbUser := getEnv("DB_USER", "root")
	dbPass := getEnv("DB_PASSWORD", "123456")
	dbHost := getEnv("DB_HOST", "127.0.0.1")
	dbPort := getEnv("DB_PORT", "3306")
	dbName := getEnv("DB_NAME", "blog_db")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPass, dbHost, dbPort, dbName)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database!", err)
	}

	// 自动迁移
	DB.AutoMigrate(&models.Post{})
	fmt.Println("数据库以成功迁移和连接!")
}

// 辅助函数，获取环境变量与默认值
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
