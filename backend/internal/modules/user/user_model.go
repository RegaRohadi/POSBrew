package user

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	RoleID    uint      `gorm:"not null;index" json:"role_id"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	Email     string    `gorm:"type:varchar(150);uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"type:varchar(255);not null" json:"-"`
	IsActive  bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Role *Role `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}

func (User) TableName() string {
	return "users"
}
