package transaction

import (
	"errors"
	"time"

	"POSBrew/internal/database"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrTransactionNotFound = errors.New("transaction not found")

type Filter struct {
	Status   *TransactionStatus
	UserID   *uint
	DateFrom *time.Time
	DateTo   *time.Time
}

type Repository interface {
	Create(transaction *Transaction) error
	CreateItems(items []TransactionItem) error
	CreatePayment(payment *Payment) error
	FindByID(id uint) (*Transaction, error)
	FindByIDForUpdate(id uint) (*Transaction, error)
	FindAll(filter Filter, offset, limit int) ([]Transaction, int64, error)
	UpdateStatus(id uint, status TransactionStatus) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(transaction *Transaction) error {
	if err := r.db.Omit("User", "Items", "Payment").Create(transaction).Error; err != nil {
		return database.TranslatePGError(err, nil, nil)
	}

	return nil
}

func (r *repository) CreateItems(items []TransactionItem) error {
	if len(items) == 0 {
		return nil
	}

	return r.db.Omit("Product").Create(&items).Error
}

func (r *repository) CreatePayment(payment *Payment) error {
	return r.db.Create(payment).Error
}

func (r *repository) FindByID(id uint) (*Transaction, error) {
	var transaction Transaction

	err := r.db.
		Preload("User").
		Preload("Items").
		Preload("Payment").
		First(&transaction, id).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrTransactionNotFound
	}
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

func (r *repository) FindByIDForUpdate(id uint) (*Transaction, error) {
	var transaction Transaction

	err := r.db.
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Preload("User").
		Preload("Items").
		Preload("Payment").
		First(&transaction, id).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrTransactionNotFound
	}
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

func (r *repository) FindAll(filter Filter, offset, limit int) ([]Transaction, int64, error) {
	var total int64

	countQuery := applyFilters(r.db.Model(&Transaction{}), filter)
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var transactions []Transaction

	listQuery := applyFilters(
		r.db.Preload("User").Preload("Payment").Order("created_at DESC"),
		filter,
	)

	err := listQuery.Offset(offset).Limit(limit).Find(&transactions).Error
	return transactions, total, err
}

func (r *repository) UpdateStatus(id uint, status TransactionStatus) error {
	result := r.db.Model(&Transaction{}).Where("id = ?", id).Update("status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrTransactionNotFound
	}

	return nil
}

func applyFilters(query *gorm.DB, filter Filter) *gorm.DB {
	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	if filter.UserID != nil {
		query = query.Where("user_id = ?", *filter.UserID)
	}
	if filter.DateFrom != nil {
		query = query.Where("created_at >= ?", *filter.DateFrom)
	}
	if filter.DateTo != nil {
		query = query.Where("created_at < ?", *filter.DateTo)
	}

	return query
}
