package product

import (
	"time"

	"POSBrew/internal/modules/category"
)

type Product struct {
	ID          uint               `gorm:"primaryKey" json:"id"`
	CategoryID  *uint              `gorm:"index" json:"category_id"`
	Category    *category.Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Name        string             `gorm:"type:varchar(150);not null" json:"name"`
	Description *string            `gorm:"type:text" json:"description"`
	Price       int64              `gorm:"not null" json:"price"`
	ImageURL    *string            `gorm:"type:text" json:"image_url"`
	IsAvailable bool               `gorm:"not null;default:true" json:"is_available"`
	CreatedAt   time.Time          `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time          `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Product) TableName() string {
	return "products"
}
