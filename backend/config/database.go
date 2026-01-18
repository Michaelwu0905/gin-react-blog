package config

import (
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
	// 从环境变量中国获取配置，若不存在则使用默认值
	dbUser := getEnv("DB_USER", "root")
	dbPass := getEnv("DB_PASSWORD", "Leahc1misM1chael")
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
	DB.AutoMigrate(&models.User{}, &models.Post{})

	// 创建默认管理员账户（如果不存在）
	createDefaultAdmin()

	fmt.Println("数据库以成功迁移和连接!")
}

// createDefaultAdmin 创建默认管理员账户
func createDefaultAdmin() {
	var admin models.User
	if DB.Where("username = ?", "admin").First(&admin).Error != nil {
		// 默认密码：admin123，建议首次登录后修改
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("创建默认管理员失败: %v", err)
			return
		}
		DB.Create(&models.User{
			Username: "admin",
			Password: string(hashedPassword),
			Role:     models.RoleAdmin,
		})
		fmt.Println("默认管理员账户已创建: admin / admin123")
	}
}

// 辅助函数，获取环境变量与默认值
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
