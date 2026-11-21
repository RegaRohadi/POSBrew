package recipe

import (
	"POSBrew/internal/modules/ingredient"
	"POSBrew/internal/modules/product"

	"github.com/shopspring/decimal"
)

type Service interface {
	Create(req CreateRecipeRequest) (*RecipeResponse, error)
	GetByProductID(productID uint) ([]RecipeResponse, error)
	GetByID(id uint) (*RecipeResponse, error)
	Update(id uint, req UpdateRecipeRequest) (*RecipeResponse, error)
	Delete(id uint) error
}

type service struct {
	repo        Repository
	products    product.Repository
	ingredients ingredient.Repository
}

func NewService(repo Repository, products product.Repository, ingredients ingredient.Repository) Service {
	return &service{
		repo:        repo,
		products:    products,
		ingredients: ingredients,
	}
}

func (s *service) Create(req CreateRecipeRequest) (*RecipeResponse, error) {
	if req.Quantity.LessThanOrEqual(decimal.Zero) {
		return nil, ErrInvalidQuantity
	}

	productRecord, err := s.products.FindByID(req.ProductID)
	if err != nil {
		return nil, err
	}

	ingredientRecord, err := s.ingredients.FindByID(req.IngredientID)
	if err != nil {
		return nil, err
	}

	exists, err := s.repo.Exists(req.ProductID, req.IngredientID, 0)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrRecipeExists
	}

	recipe := &Recipe{
		ProductID:    productRecord.ID,
		Product:      productRecord,
		IngredientID: ingredientRecord.ID,
		Ingredient:   ingredientRecord,
		Quantity:     req.Quantity,
	}

	if err := s.repo.Create(recipe); err != nil {
		return nil, err
	}

	res := toResponse(recipe)
	return &res, nil
}

func (s *service) GetByProductID(productID uint) ([]RecipeResponse, error) {
	if productID == 0 {
		return nil, ErrProductIDRequired
	}

	if _, err := s.products.FindByID(productID); err != nil {
		return nil, err
	}

	recipes, err := s.repo.FindByProductID(productID)
	if err != nil {
		return nil, err
	}

	result := make([]RecipeResponse, 0, len(recipes))
	for i := range recipes {
		result = append(result, toResponse(&recipes[i]))
	}

	return result, nil
}

func (s *service) GetByID(id uint) (*RecipeResponse, error) {
	recipe, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	res := toResponse(recipe)
	return &res, nil
}

func (s *service) Update(id uint, req UpdateRecipeRequest) (*RecipeResponse, error) {
	if req.Quantity.LessThanOrEqual(decimal.Zero) {
		return nil, ErrInvalidQuantity
	}

	recipe, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	recipe.Quantity = req.Quantity

	if err := s.repo.Update(recipe); err != nil {
		return nil, err
	}

	res := toResponse(recipe)
	return &res, nil
}

func (s *service) Delete(id uint) error {
	return s.repo.Delete(id)
}
