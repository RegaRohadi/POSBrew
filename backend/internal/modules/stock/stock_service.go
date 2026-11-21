package stock

import (
	"errors"
	"fmt"

	"POSBrew/internal/common/pagination"
	"POSBrew/internal/modules/ingredient"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

var (
	ErrInvalidMovementType = errors.New("movement type must be purchase, waste, or adjustment")
	ErrInvalidQuantity     = errors.New("quantity must be greater than zero")
	ErrInvalidTargetStock  = errors.New("target stock is required and cannot be negative")
	ErrInsufficientStock   = errors.New("insufficient ingredient stock")
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) Create(req CreateMovementRequest) (*StockUpdateResponse, error) {
	switch req.Type {
	case StockMovementTypePurchase, StockMovementTypeWaste:
		if req.Quantity.LessThanOrEqual(decimal.Zero) {
			return nil, ErrInvalidQuantity
		}
	case StockMovementTypeAdjustment:
		if req.TargetStock == nil || req.TargetStock.IsNegative() {
			return nil, ErrInvalidTargetStock
		}
	default:
		return nil, ErrInvalidMovementType
	}

	var result *StockUpdateResponse

	err := s.db.Transaction(func(tx *gorm.DB) error {
		ingredients := ingredient.NewRepository(tx)
		movements := NewRepository(tx)

		current, err := ingredients.FindByIDForUpdate(req.IngredientID)
		if err != nil {
			return err
		}

		var (
			newStock    decimal.Decimal
			movementQty decimal.Decimal
		)

		switch req.Type {
		case StockMovementTypePurchase:
			newStock = current.Stock.Add(req.Quantity)
			movementQty = req.Quantity
		case StockMovementTypeWaste:
			if current.Stock.LessThan(req.Quantity) {
				return fmt.Errorf("%w: available %s %s", ErrInsufficientStock, current.Stock, unitLabel(current))
			}
			newStock = current.Stock.Sub(req.Quantity)
			movementQty = req.Quantity
		case StockMovementTypeAdjustment:
			newStock = *req.TargetStock
			delta := newStock.Sub(current.Stock)
			if delta.IsZero() {
				result = &StockUpdateResponse{
					IngredientID: current.ID,
					Stock:        newStock,
				}
				return nil
			}
			movementQty = delta.Abs()
		}

		if err := ingredients.UpdateStock(current.ID, newStock); err != nil {
			return err
		}

		referenceType := "manual"
		movement := &StockMovement{
			IngredientID:  current.ID,
			Ingredient:    current,
			Type:          req.Type,
			Quantity:      movementQty,
			Notes:         req.Notes,
			ReferenceType: &referenceType,
		}

		if err := movements.Create(movement); err != nil {
			return err
		}

		movementRes := toMovementResponse(movement)
		result = &StockUpdateResponse{
			IngredientID: current.ID,
			Stock:        newStock,
			Movement:     &movementRes,
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (s *Service) GetAll(query ListMovementsQuery) (*MovementListResponse, error) {
	page, limit := pagination.Normalize(query.Page, query.Limit)

	filter := Filter{
		IngredientID: query.IngredientID,
		Type:         query.Type,
	}

	repo := NewRepository(s.db)

	movements, total, err := repo.FindAll(filter, pagination.Offset(page, limit), limit)
	if err != nil {
		return nil, err
	}

	items := make([]MovementResponse, 0, len(movements))
	for i := range movements {
		items = append(items, toMovementResponse(&movements[i]))
	}

	return &MovementListResponse{
		Items:      items,
		Pagination: pagination.NewMeta(total, page, limit),
	}, nil
}

func unitLabel(item *ingredient.Ingredient) string {
	if item.Unit != nil {
		return item.Unit.Abbreviation
	}

	return ""
}
