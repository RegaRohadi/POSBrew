package transaction

import (
	"time"

	"POSBrew/internal/modules/user"
)

type TransactionStatus string

const (
	TransactionStatusPending   TransactionStatus = "pending"
	TransactionStatusPaid      TransactionStatus = "paid"
	TransactionStatusCancelled TransactionStatus = "cancelled"
)

type Transaction struct {
	ID            uint              `gorm:"primaryKey" json:"id"`
	UserID        uint              `gorm:"not null;index" json:"user_id"`
	User          *user.User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	InvoiceNumber string            `gorm:"type:varchar(50);not null;uniqueIndex" json:"invoice_number"`
	Subtotal      int64             `gorm:"not null" json:"subtotal"`
	Discount      int64             `gorm:"not null;default:0" json:"discount"`
	Total         int64             `gorm:"not null" json:"total"`
	Status        TransactionStatus `gorm:"type:varchar(20);not null;default:'pending';index" json:"status"`
	CreatedAt     time.Time         `gorm:"autoCreateTime;index" json:"created_at"`
	UpdatedAt     time.Time         `gorm:"autoUpdateTime" json:"updated_at"`

	Items   []TransactionItem `gorm:"foreignKey:TransactionID" json:"items,omitempty"`
	Payment *Payment          `gorm:"foreignKey:TransactionID" json:"payment,omitempty"`
}

func (Transaction) TableName() string {
	return "transactions"
}
