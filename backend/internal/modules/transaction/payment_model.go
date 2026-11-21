package transaction

import "time"

type PaymentMethod string

const (
	PaymentMethodCash  PaymentMethod = "cash"
	PaymentMethodQRIS  PaymentMethod = "qris"
	PaymentMethodDebit PaymentMethod = "debit"
)

type PaymentStatus string

const (
	PaymentStatusPending PaymentStatus = "pending"
	PaymentStatusSuccess PaymentStatus = "success"
	PaymentStatusFailed  PaymentStatus = "failed"
)

type Payment struct {
	ID            uint          `gorm:"primaryKey" json:"id"`
	TransactionID uint          `gorm:"not null;uniqueIndex" json:"transaction_id"`
	Method        PaymentMethod `gorm:"type:varchar(20);not null" json:"method"`
	Amount        int64         `gorm:"not null" json:"amount"`
	Status        PaymentStatus `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	PaidAt        *time.Time    `json:"paid_at"`
	CreatedAt     time.Time     `gorm:"autoCreateTime" json:"created_at"`
}

func (Payment) TableName() string {
	return "payments"
}
