package transaction

import (
	"time"

	"POSBrew/internal/common/pagination"
)

type CreateTransactionItemRequest struct {
	ProductID uint `json:"product_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,gt=0"`
}

type CreateTransactionRequest struct {
	Items         []CreateTransactionItemRequest `json:"items" binding:"required,min=1,dive"`
	Discount      int64                          `json:"discount" binding:"gte=0"`
	PaymentMethod PaymentMethod                  `json:"payment_method" binding:"required,oneof=cash qris debit"`
	PaymentAmount int64                          `json:"payment_amount" binding:"required,gt=0"`
}

type ListTransactionsQuery struct {
	Page     int    `form:"page"`
	Limit    int    `form:"limit"`
	Status   string `form:"status"`
	UserID   *uint  `form:"user_id"`
	DateFrom string `form:"date_from"`
	DateTo   string `form:"date_to"`
}

type TransactionItemResponse struct {
	ID          uint   `json:"id"`
	ProductID   uint   `json:"product_id"`
	ProductName string `json:"product_name"`
	Quantity    int    `json:"quantity"`
	Price       int64  `json:"price"`
	Subtotal    int64  `json:"subtotal"`
}

type PaymentResponse struct {
	ID     uint          `json:"id"`
	Method PaymentMethod `json:"method"`
	Amount int64         `json:"amount"`
	Status PaymentStatus `json:"status"`
	PaidAt *time.Time    `json:"paid_at"`
}

type TransactionResponse struct {
	ID            uint                      `json:"id"`
	InvoiceNumber string                    `json:"invoice_number"`
	UserID        uint                      `json:"user_id"`
	UserName      string                    `json:"user_name,omitempty"`
	Subtotal      int64                     `json:"subtotal"`
	Discount      int64                     `json:"discount"`
	Total         int64                     `json:"total"`
	Change        int64                     `json:"change"`
	Status        TransactionStatus         `json:"status"`
	Items         []TransactionItemResponse `json:"items,omitempty"`
	Payment       *PaymentResponse          `json:"payment,omitempty"`
	CreatedAt     time.Time                 `json:"created_at"`
	UpdatedAt     time.Time                 `json:"updated_at"`
}

type TransactionListResponse struct {
	Items      []TransactionResponse `json:"items"`
	Pagination pagination.Meta       `json:"pagination"`
}

func toResponse(transaction *Transaction) TransactionResponse {
	res := TransactionResponse{
		ID:            transaction.ID,
		InvoiceNumber: transaction.InvoiceNumber,
		UserID:        transaction.UserID,
		Subtotal:      transaction.Subtotal,
		Discount:      transaction.Discount,
		Total:         transaction.Total,
		Status:        transaction.Status,
		CreatedAt:     transaction.CreatedAt,
		UpdatedAt:     transaction.UpdatedAt,
	}

	if transaction.User != nil {
		res.UserName = transaction.User.Name
	}

	if transaction.Payment != nil {
		res.Payment = &PaymentResponse{
			ID:     transaction.Payment.ID,
			Method: transaction.Payment.Method,
			Amount: transaction.Payment.Amount,
			Status: transaction.Payment.Status,
			PaidAt: transaction.Payment.PaidAt,
		}

		if transaction.Payment.Method == PaymentMethodCash {
			res.Change = transaction.Payment.Amount - transaction.Total
		}
	}

	items := make([]TransactionItemResponse, 0, len(transaction.Items))
	for i := range transaction.Items {
		item := &transaction.Items[i]
		items = append(items, TransactionItemResponse{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductName: item.ProductName,
			Quantity:    item.Quantity,
			Price:       item.Price,
			Subtotal:    item.Subtotal,
		})
	}
	res.Items = items

	return res
}
