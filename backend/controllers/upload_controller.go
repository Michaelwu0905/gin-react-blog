package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadImage 处理图片上传
func UploadImage(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "获取文件失败: " + err.Error()})
		return
	}

	// 验证文件类型
	ext := filepath.Ext(file.Filename)
	allowedExts := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
	}
	if !allowedExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不支持的文件格式，仅支持 jpg, jpeg, png, gif, webp"})
		return
	}

	// 限制文件大小 (10MB)
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件大小不能超过 10MB"})
		return
	}

	// 确保 uploads 目录存在
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建上传目录失败"})
		return
	}

	// 生成唯一文件名
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, filename)

	// 保存文件
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败: " + err.Error()})
		return
	}

	// 返回图片访问 URL
	imageURL := "/uploads/" + filename
	c.JSON(http.StatusOK, gin.H{
		"url":      imageURL,
		"filename": filename,
	})
}
