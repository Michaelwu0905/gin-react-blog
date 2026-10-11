package config

import (
	"errors"
	"fmt"
	"log"
	"my-blog-backend/models"
	"os"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	// 从环境变量中获取配置，若不存在则使用默认值
	dbUser := getEnv("DB_USER", "root")
	dbPass := getEnv("DB_PASSWORD", "")
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

	// 自动迁移 User 和 Post 模型
	if err := DB.AutoMigrate(&models.User{}, &models.Post{}); err != nil {
		log.Fatal("Failed to migrate database", err)
	}

	// 创建默认管理员账户（如果不存在）
	createDefaultAdmin()

	fmt.Println("数据库已成功迁移和连接!")
}

// createDefaultAdmin 创建默认管理员账户
func createDefaultAdmin() {
	var admin models.User
	username := getEnv("ADMIN_USERNAME", "admin")
	err := DB.Where("username = ?", username).First(&admin).Error
	if err == nil {
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Fatal("检查管理员账户失败", err)
	}
	password := os.Getenv("ADMIN_PASSWORD")
	if password == "" {
		log.Println("未配置 ADMIN_PASSWORD，跳过管理员初始化")
		return
	}
	{
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("创建默认管理员失败: %v", err)
			return
		}
		if err := DB.Create(&models.User{
			Username: username,
			Password: string(hashedPassword),
			Role:     models.RoleAdmin,
		}).Error; err != nil {
			log.Fatal("创建管理员失败", err)
		}
		fmt.Println("管理员账户已初始化")
	}
}

// 辅助函数，获取环境变量与默认值
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
