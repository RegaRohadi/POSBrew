package category

import (
	"errors"

	"POSBrew/internal/database"

	"gorm.io/gorm"
)

var (
	ErrCategoryNotFound   = errors.New("category not found")
	ErrCategoryNameExists = errors.New("category name already exists")
	ErrCategoryInUse      = errors.New("category is used by products")
)

type Repository interface {
	Create(category *Category) error
	FindAll() ([]Category, error)
	FindByID(id uint) (*Category, error)
	Update(category *Category) error
	Delete(id uint) error
	ExistsByName(name string, excludeID uint) (bool, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(category *Category) error {
	if err := r.db.Create(category).Error; err != nil {
		return database.TranslatePGError(err, ErrCategoryNameExists, ErrCategoryInUse)
	}

	return nil
}

func (r *repository) FindAll() ([]Category, error) {
	var categories []Category

	err := r.db.Order("name ASC").Find(&categories).Error
	return categories, err
}

func (r *repository) FindByID(id uint) (*Category, error) {
	var category Category

	err := r.db.First(&category, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrCategoryNotFound
	}
	if err != nil {
		return nil, err
	}

	return &category, nil
}

func (r *repository) Update(category *Category) error {
	if err := r.db.Save(category).Error; err != nil {
		return database.TranslatePGError(err, ErrCategoryNameExists, ErrCategoryInUse)
	}

	return nil
}

func (r *repository) Delete(id uint) error {
	result := r.db.Delete(&Category{}, id)
	if result.Error != nil {
		return database.TranslatePGError(result.Error, nil, ErrCategoryInUse)
	}
	if result.RowsAffected == 0 {
		return ErrCategoryNotFound
	}

	return nil
}

func (r *repository) ExistsByName(name string, excludeID uint) (bool, error) {
	var count int64

	query := r.db.Model(&Category{}).Where("LOWER(name) = LOWER(?)", name)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}

	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}
