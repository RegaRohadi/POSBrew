package product

import (
	"errors"

	"POSBrew/internal/database"
	"POSBrew/internal/modules/category"

	"gorm.io/gorm"
)

var (
	ErrProductNotFound = errors.New("product not found")
	ErrProductInUse    = errors.New("product is used by recipes or transactions")
)

type Filter struct {
	Search      string
	CategoryID  *uint
	IsAvailable *bool
}

type Repository interface {
	Create(product *Product) error
	Update(product *Product) error
	FindAll(filter Filter, offset, limit int) ([]Product, int64, error)
	FindByID(id uint) (*Product, error)
	FindByIDs(ids []uint) ([]Product, error)
	Delete(id uint) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(product *Product) error {
	if err := r.db.Omit("Category").Create(product).Error; err != nil {
		return database.TranslatePGError(err, nil, category.ErrCategoryNotFound)
	}

	return nil
}

func (r *repository) Update(product *Product) error {
	if err := r.db.Omit("Category").Save(product).Error; err != nil {
		return database.TranslatePGError(err, nil, category.ErrCategoryNotFound)
	}

	return nil
}

func (r *repository) FindAll(filter Filter, offset, limit int) ([]Product, int64, error) {
	var total int64

	countQuery := applyFilters(r.db.Model(&Product{}), filter)

	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var products []Product

	listQuery := applyFilters(r.db.Preload("Category").Order("name ASC"), filter)

	err := listQuery.Offset(offset).Limit(limit).Find(&products).Error
	return products, total, err
}

func (r *repository) FindByID(id uint) (*Product, error) {
	var product Product

	err := r.db.Preload("Category").First(&product, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrProductNotFound
	}
	if err != nil {
		return nil, err
	}

	return &product, nil
}

func (r *repository) FindByIDs(ids []uint) ([]Product, error) {
	var products []Product

	err := r.db.Preload("Category").Where("id IN ?", ids).Find(&products).Error
	return products, err
}

func (r *repository) Delete(id uint) error {
	result := r.db.Delete(&Product{}, id)
	if result.Error != nil {
		return database.TranslatePGError(result.Error, nil, ErrProductInUse)
	}
	if result.RowsAffected == 0 {
		return ErrProductNotFound
	}

	return nil
}

func applyFilters(query *gorm.DB, filter Filter) *gorm.DB {
	if filter.Search != "" {
		query = query.Where("name ILIKE ?", "%"+filter.Search+"%")
	}
	if filter.CategoryID != nil {
		query = query.Where("category_id = ?", *filter.CategoryID)
	}
	if filter.IsAvailable != nil {
		query = query.Where("is_available = ?", *filter.IsAvailable)
	}

	return query
}
