package report

import (
	"time"

	"POSBrew/internal/modules/ingredient"
	"POSBrew/internal/modules/transaction"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Summary() (*SummaryResponse, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	result := &SummaryResponse{}

	paid := transaction.TransactionStatusPaid

	if err := r.db.Model(&transaction.Transaction{}).
		Where("status = ? AND created_at >= ?", paid, today).
		Select("COALESCE(SUM(total), 0)").
		Scan(&result.TodayRevenue).Error; err != nil {
		return nil, err
	}

	if err := r.db.Model(&transaction.Transaction{}).
		Where("status = ? AND created_at >= ?", paid, today).
		Count(&result.TodayTransactions).Error; err != nil {
		return nil, err
	}

	if err := r.db.Model(&transaction.Transaction{}).
		Where("status = ? AND created_at >= ?", paid, monthStart).
		Select("COALESCE(SUM(total), 0)").
		Scan(&result.MonthRevenue).Error; err != nil {
		return nil, err
	}

	if err := r.db.Model(&transaction.Transaction{}).
		Where("status = ? AND created_at >= ?", paid, monthStart).
		Count(&result.MonthTransactions).Error; err != nil {
		return nil, err
	}

	if err := r.db.Model(&transaction.Transaction{}).
		Where("status = ?", paid).
		Select("COALESCE(SUM(total), 0)").
		Scan(&result.TotalRevenue).Error; err != nil {
		return nil, err
	}

	if err := r.db.Model(&transaction.Transaction{}).
		Where("status = ?", paid).
		Count(&result.TotalTransactions).Error; err != nil {
		return nil, err
	}

	if err := r.db.Model(&ingredient.Ingredient{}).
		Where("is_active = ? AND stock <= minimum_stock", true).
		Count(&result.LowStockIngredients).Error; err != nil {
		return nil, err
	}

	return result, nil
}

func (r *Repository) DailySales(from, to time.Time) ([]DailySalesItem, error) {
	var items []DailySalesItem

	err := r.db.Model(&transaction.Transaction{}).
		Select("TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS transactions").
		Where("status = ? AND created_at >= ? AND created_at < ?", transaction.TransactionStatusPaid, from, to).
		Group("TO_CHAR(created_at, 'YYYY-MM-DD')").
		Order("date ASC").
		Scan(&items).Error

	return items, err
}

func (r *Repository) TopProducts(from, to time.Time, limit int) ([]TopProductItem, error) {
	var items []TopProductItem

	err := r.db.Table("transaction_items AS ti").
		Select("ti.product_id, ti.product_name, SUM(ti.quantity) AS quantity_sold, COALESCE(SUM(ti.subtotal), 0) AS revenue").
		Joins("JOIN transactions AS t ON t.id = ti.transaction_id").
		Where("t.status = ? AND t.created_at >= ? AND t.created_at < ?", transaction.TransactionStatusPaid, from, to).
		Group("ti.product_id, ti.product_name").
		Order("quantity_sold DESC").
		Limit(limit).
		Scan(&items).Error

	return items, err
}

func (r *Repository) LowStock() ([]LowStockItem, error) {
	var ingredients []ingredient.Ingredient

	err := r.db.
		Preload("Unit").
		Where("is_active = ? AND stock <= minimum_stock", true).
		Order("stock ASC").
		Find(&ingredients).Error
	if err != nil {
		return nil, err
	}

	items := make([]LowStockItem, 0, len(ingredients))
	for i := range ingredients {
		item := &ingredients[i]
		unit := ""
		if item.Unit != nil {
			unit = item.Unit.Abbreviation
		}

		items = append(items, LowStockItem{
			ID:           item.ID,
			Name:         item.Name,
			Unit:         unit,
			Stock:        item.Stock,
			MinimumStock: item.MinimumStock,
		})
	}

	return items, nil
}
