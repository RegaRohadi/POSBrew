package recipe

import (
	"errors"

	"POSBrew/internal/database"

	"gorm.io/gorm"
)

var (
	ErrRecipeNotFound          = errors.New("recipe not found")
	ErrRecipeExists            = errors.New("recipe for this product and ingredient already exists")
	ErrRecipeReferenceNotFound = errors.New("product or ingredient not found")
	ErrInvalidQuantity         = errors.New("quantity must be greater than zero")
	ErrProductIDRequired       = errors.New("product_id query parameter is required")
)

type Repository interface {
	Create(recipe *Recipe) error
	Update(recipe *Recipe) error
	FindByID(id uint) (*Recipe, error)
	FindByProductID(productID uint) ([]Recipe, error)
	FindByProductIDs(productIDs []uint) ([]Recipe, error)
	Delete(id uint) error
	Exists(productID, ingredientID uint, excludeID uint) (bool, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(recipe *Recipe) error {
	if err := r.db.Omit("Product", "Ingredient").Create(recipe).Error; err != nil {
		return database.TranslatePGError(err, ErrRecipeExists, ErrRecipeReferenceNotFound)
	}

	return nil
}

func (r *repository) Update(recipe *Recipe) error {
	if err := r.db.Omit("Product", "Ingredient").Save(recipe).Error; err != nil {
		return database.TranslatePGError(err, ErrRecipeExists, ErrRecipeReferenceNotFound)
	}

	return nil
}

func (r *repository) FindByID(id uint) (*Recipe, error) {
	var recipe Recipe

	err := r.db.Preload("Product").Preload("Ingredient").Preload("Ingredient.Unit").First(&recipe, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrRecipeNotFound
	}
	if err != nil {
		return nil, err
	}

	return &recipe, nil
}

func (r *repository) FindByProductID(productID uint) ([]Recipe, error) {
	return r.FindByProductIDs([]uint{productID})
}

func (r *repository) FindByProductIDs(productIDs []uint) ([]Recipe, error) {
	var recipes []Recipe

	err := r.db.
		Preload("Product").
		Preload("Ingredient").
		Preload("Ingredient.Unit").
		Where("product_id IN ?", productIDs).
		Order("id ASC").
		Find(&recipes).Error

	return recipes, err
}

func (r *repository) Delete(id uint) error {
	result := r.db.Delete(&Recipe{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrRecipeNotFound
	}

	return nil
}

func (r *repository) Exists(productID, ingredientID uint, excludeID uint) (bool, error) {
	var count int64

	query := r.db.Model(&Recipe{}).
		Where("product_id = ? AND ingredient_id = ?", productID, ingredientID)

	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}

	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}
