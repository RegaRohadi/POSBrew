package ingredient

import (
	"errors"

	"POSBrew/internal/database"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrIngredientNotFound   = errors.New("ingredient not found")
	ErrIngredientNameExists = errors.New("ingredient name already exists")
	ErrIngredientInUse      = errors.New("ingredient is used by recipes or stock movements")
	ErrInvalidMinimumStock  = errors.New("minimum stock cannot be negative")
)

type Filter struct {
	Search   string
	IsActive *bool
	LowStock bool
}

type Repository interface {
	Create(ingredient *Ingredient) error
	Update(ingredient *Ingredient) error
	FindAll(filter Filter, offset, limit int) ([]Ingredient, int64, error)
	FindByID(id uint) (*Ingredient, error)
	FindByIDForUpdate(id uint) (*Ingredient, error)
	FindByIDsForUpdate(ids []uint) ([]Ingredient, error)
	UpdateStock(id uint, stock decimal.Decimal) error
	Delete(id uint) error
	ExistsByName(name string, excludeID uint) (bool, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ingredient *Ingredient) error {
	if err := r.db.Omit("Unit").Create(ingredient).Error; err != nil {
		return database.TranslatePGError(err, ErrIngredientNameExists, nil)
	}

	return nil
}

func (r *repository) Update(ingredient *Ingredient) error {
	if err := r.db.Omit("Unit", "Stock").Save(ingredient).Error; err != nil {
		return database.TranslatePGError(err, ErrIngredientNameExists, nil)
	}

	return nil
}

func (r *repository) FindAll(filter Filter, offset, limit int) ([]Ingredient, int64, error) {
	var total int64

	countQuery := applyFilters(r.db.Model(&Ingredient{}), filter)

	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var ingredients []Ingredient

	listQuery := applyFilters(r.db.Preload("Unit").Order("name ASC"), filter)

	err := listQuery.Offset(offset).Limit(limit).Find(&ingredients).Error
	return ingredients, total, err
}

func (r *repository) FindByID(id uint) (*Ingredient, error) {
	var ingredient Ingredient

	err := r.db.Preload("Unit").First(&ingredient, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrIngredientNotFound
	}
	if err != nil {
		return nil, err
	}

	return &ingredient, nil
}

func (r *repository) FindByIDForUpdate(id uint) (*Ingredient, error) {
	var ingredient Ingredient

	err := r.db.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Unit").First(&ingredient, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrIngredientNotFound
	}
	if err != nil {
		return nil, err
	}

	return &ingredient, nil
}

func (r *repository) FindByIDsForUpdate(ids []uint) ([]Ingredient, error) {
	var ingredients []Ingredient

	err := r.db.Clauses(clause.Locking{Strength: "UPDATE"}).
		Preload("Unit").
		Where("id IN ?", ids).
		Find(&ingredients).Error

	return ingredients, err
}

func (r *repository) UpdateStock(id uint, stock decimal.Decimal) error {
	result := r.db.Model(&Ingredient{}).Where("id = ?", id).Update("stock", stock)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrIngredientNotFound
	}

	return nil
}

func (r *repository) Delete(id uint) error {
	result := r.db.Delete(&Ingredient{}, id)
	if result.Error != nil {
		return database.TranslatePGError(result.Error, nil, ErrIngredientInUse)
	}
	if result.RowsAffected == 0 {
		return ErrIngredientNotFound
	}

	return nil
}

func (r *repository) ExistsByName(name string, excludeID uint) (bool, error) {
	var count int64

	query := r.db.Model(&Ingredient{}).Where("LOWER(name) = LOWER(?)", name)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}

	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}

func applyFilters(query *gorm.DB, filter Filter) *gorm.DB {
	if filter.Search != "" {
		query = query.Where("name ILIKE ?", "%"+filter.Search+"%")
	}
	if filter.IsActive != nil {
		query = query.Where("is_active = ?", *filter.IsActive)
	}
	if filter.LowStock {
		query = query.Where("stock <= minimum_stock")
	}

	return query
}
