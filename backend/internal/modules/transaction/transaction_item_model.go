package transaction

import (
	"time"

	"POSBrew/internal/modules/product"
)

type TransactionItem struct {
	ID            uint             `gorm:"primaryKey" json:"id"`
	TransactionID uint             `gorm:"not null;index" json:"transaction_id"`
	ProductID     uint             `gorm:"not null;index" json:"product_id"`
	Product       *product.Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	ProductName   string           `gorm:"type:varchar(150);not null" json:"product_name"`
	Quantity      int              `gorm:"not null" json:"quantity"`
	Price         int64            `gorm:"not null" json:"price"`
	Subtotal      int64            `gorm:"not null" json:"subtotal"`
	CreatedAt     time.Time        `gorm:"autoCreateTime" json:"created_at"`
}

func (TransactionItem) TableName() string {
	return "transaction_items"
}
