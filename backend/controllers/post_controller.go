package controllers

import (
	"my-blog-backend/config"
	"my-blog-backend/middleware"
	"my-blog-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetPosts 获取所有文章
func GetPosts(c *gin.Context) {
	var posts []models.Post
	// 预加载作者信息
	config.DB.Preload("Author").Order("created_at desc").Find(&posts)
	c.JSON(http.StatusOK, gin.H{"data": posts})
}

// CreatePost 创建文章（需要登录）
func CreatePost(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
		return
	}

	var input struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "标题和内容不能为空"})
		return
	}

	post := models.Post{
		Title:    input.Title,
		Content:  input.Content,
		AuthorID: user.ID,
	}

	if err := config.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建文章失败"})
		return
	}

	// 加载作者信息后返回
	config.DB.Preload("Author").First(&post, post.ID)

	c.JSON(http.StatusOK, gin.H{"data": post})
}

// GetPostById 获取单篇文章
func GetPostById(c *gin.Context) {
	var post models.Post
	if err := config.DB.Preload("Author").Where("id = ?", c.Param("id")).First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": post})
}

// UpdatePost 更新文章（只有作者或管理员可以）
func UpdatePost(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
		return
	}

	var post models.Post
	if err := config.DB.Where("id = ?", c.Param("id")).First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		return
	}

	// 检查权限：只有作者或管理员可以编辑
	if post.AuthorID != user.ID && !user.IsAdmin() {
		c.JSON(http.StatusForbidden, gin.H{"error": "没有权限编辑此文章"})
		return
	}

	var input struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新文章
	updates := map[string]interface{}{}
	if input.Title != "" {
		updates["title"] = input.Title
	}
	if input.Content != "" {
		updates["content"] = input.Content
	}

	if err := config.DB.Model(&post).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新文章失败"})
		return
	}

	// 重新加载文章信息
	config.DB.Preload("Author").First(&post, post.ID)

	c.JSON(http.StatusOK, gin.H{"data": post})
}

// DeletePost 删除文章（只有作者或管理员可以）
func DeletePost(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
		return
	}

	var post models.Post
	if err := config.DB.Where("id = ?", c.Param("id")).First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		return
	}

	// 检查权限：只有作者或管理员可以删除
	if post.AuthorID != user.ID && !user.IsAdmin() {
		c.JSON(http.StatusForbidden, gin.H{"error": "没有权限删除此文章"})
		return
	}

	if err := config.DB.Delete(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文章失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "文章已删除"})
}

// GetMyPosts 获取当前用户的文章
func GetMyPosts(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
		return
	}

	var posts []models.Post
	config.DB.Preload("Author").Where("author_id = ?", user.ID).Order("created_at desc").Find(&posts)
	c.JSON(http.StatusOK, gin.H{"data": posts})
}
