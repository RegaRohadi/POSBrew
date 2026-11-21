package stock

import (
	"gorm.io/gorm"
)

type Filter struct {
	IngredientID *uint
	Type         *StockMovementType
}

type Repository interface {
	Create(movement *StockMovement) error
	FindAll(filter Filter, offset, limit int) ([]StockMovement, int64, error)
	FindByReference(referenceType string, referenceID uint, movementType StockMovementType) ([]StockMovement, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(movement *StockMovement) error {
	return r.db.Omit("Ingredient").Create(movement).Error
}

func (r *repository) FindAll(filter Filter, offset, limit int) ([]StockMovement, int64, error) {
	var total int64

	countQuery := applyFilters(r.db.Model(&StockMovement{}), filter)

	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var movements []StockMovement

	listQuery := applyFilters(
		r.db.Preload("Ingredient").Preload("Ingredient.Unit").Order("created_at DESC"),
		filter,
	)

	err := listQuery.Offset(offset).Limit(limit).Find(&movements).Error
	return movements, total, err
}

func (r *repository) FindByReference(referenceType string, referenceID uint, movementType StockMovementType) ([]StockMovement, error) {
	var movements []StockMovement

	err := r.db.
		Where("reference_type = ? AND reference_id = ? AND type = ?", referenceType, referenceID, movementType).
		Order("id ASC").
		Find(&movements).Error

	return movements, err
}

func applyFilters(query *gorm.DB, filter Filter) *gorm.DB {
	if filter.IngredientID != nil {
		query = query.Where("ingredient_id = ?", *filter.IngredientID)
	}
	if filter.Type != nil {
		query = query.Where("type = ?", *filter.Type)
	}

	return query
}
