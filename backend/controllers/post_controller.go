package controllers

import (
	"my-blog-backend/config"
	"my-blog-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetPost获取所有文章
func GetPosts(c *gin.Context) {
	var posts []models.Post
	config.DB.Find(&posts)
	c.JSON(http.StatusOK, gin.H{"data": posts})
}

// 创建文章
func CreatePost(c *gin.Context) {
	var input models.Post
	// 绑定json数据
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post := models.Post{
		Title:   input.Title,
		Content: input.Content,
	}
	config.DB.Create(&post)

	c.JSON(http.StatusOK, gin.H{"data": post})
}

// GetPostById 获取单篇文章
func GetPostById(c *gin.Context) {
	var post models.Post
	if err := config.DB.Where("id=?", c.Param("id")).First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": post})
}
