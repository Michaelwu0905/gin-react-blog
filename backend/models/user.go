package models

import "time"

// 用户角色常量
const (
	RoleUser  = "user"
	RoleAdmin = "admin"
)

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"unique;not null;size:50"`
	Password  string    `json:"-" gorm:"not null"` // json:"-" 表示不返回给前端
	Role      string    `json:"role" gorm:"default:user;size:20"` // user 或 admin
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// IsAdmin 检查用户是否是管理员
func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}
