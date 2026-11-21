package ingredient

import (
	"strings"

	"POSBrew/internal/common/pagination"
	"POSBrew/internal/modules/unit"

	"github.com/shopspring/decimal"
)

type Service interface {
	Create(req CreateIngredientRequest) (*IngredientResponse, error)
	GetAll(query ListIngredientsQuery) (*IngredientListResponse, error)
	GetByID(id uint) (*IngredientResponse, error)
	Update(id uint, req UpdateIngredientRequest) (*IngredientResponse, error)
	Delete(id uint) error
}

type service struct {
	repo  Repository
	units unit.Repository
}

func NewService(repo Repository, units unit.Repository) Service {
	return &service{
		repo:  repo,
		units: units,
	}
}

func (s *service) Create(req CreateIngredientRequest) (*IngredientResponse, error) {
	if req.MinimumStock.IsNegative() {
		return nil, ErrInvalidMinimumStock
	}

	unitRecord, err := s.units.FindByID(req.UnitID)
	if err != nil {
		return nil, err
	}

	name := strings.TrimSpace(req.Name)
	exists, err := s.repo.ExistsByName(name, 0)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrIngredientNameExists
	}

	ingredient := &Ingredient{
		UnitID:       unitRecord.ID,
		Unit:         unitRecord,
		Name:         name,
		Stock:        decimal.Zero,
		MinimumStock: req.MinimumStock,
		IsActive:     true,
	}

	if err := s.repo.Create(ingredient); err != nil {
		return nil, err
	}

	res := toResponse(ingredient)
	return &res, nil
}

func (s *service) GetAll(query ListIngredientsQuery) (*IngredientListResponse, error) {
	page, limit := pagination.Normalize(query.Page, query.Limit)

	filter := Filter{
		Search:   query.Search,
		IsActive: query.IsActive,
		LowStock: query.LowStock,
	}

	ingredients, total, err := s.repo.FindAll(filter, pagination.Offset(page, limit), limit)
	if err != nil {
		return nil, err
	}

	items := make([]IngredientResponse, 0, len(ingredients))
	for i := range ingredients {
		items = append(items, toResponse(&ingredients[i]))
	}

	return &IngredientListResponse{
		Items:      items,
		Pagination: pagination.NewMeta(total, page, limit),
	}, nil
}

func (s *service) GetByID(id uint) (*IngredientResponse, error) {
	ingredient, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	res := toResponse(ingredient)
	return &res, nil
}

func (s *service) Update(id uint, req UpdateIngredientRequest) (*IngredientResponse, error) {
	if req.MinimumStock.IsNegative() {
		return nil, ErrInvalidMinimumStock
	}

	ingredient, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	unitRecord, err := s.units.FindByID(req.UnitID)
	if err != nil {
		return nil, err
	}

	name := strings.TrimSpace(req.Name)
	exists, err := s.repo.ExistsByName(name, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrIngredientNameExists
	}

	ingredient.UnitID = unitRecord.ID
	ingredient.Unit = unitRecord
	ingredient.Name = name
	ingredient.MinimumStock = req.MinimumStock

	if req.IsActive != nil {
		ingredient.IsActive = *req.IsActive
	}

	if err := s.repo.Update(ingredient); err != nil {
		return nil, err
	}

	res := toResponse(ingredient)
	return &res, nil
}

func (s *service) Delete(id uint) error {
	return s.repo.Delete(id)
}
