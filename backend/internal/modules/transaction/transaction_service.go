package transaction

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"POSBrew/internal/common/pagination"
	"POSBrew/internal/modules/ingredient"
	"POSBrew/internal/modules/product"
	"POSBrew/internal/modules/recipe"
	"POSBrew/internal/modules/stock"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

var (
	ErrEmptyItems                  = errors.New("transaction items cannot be empty")
	ErrInvalidQuantity             = errors.New("quantity must be greater than zero")
	ErrInvalidDiscount             = errors.New("discount cannot exceed subtotal")
	ErrInsufficientPayment         = errors.New("payment amount is less than total")
	ErrInsufficientStock           = errors.New("insufficient ingredient stock")
	ErrProductUnavailable          = errors.New("product is not available")
	ErrTransactionAlreadyCancelled = errors.New("transaction is already cancelled")
	ErrInvalidStatus               = errors.New("invalid transaction status")
	ErrInvalidDate                 = errors.New("invalid date format, use YYYY-MM-DD")
)

type Service struct {
	db           *gorm.DB
	transactions Repository
	products     product.Repository
	recipes      recipe.Repository
}

func NewService(
	db *gorm.DB,
	transactions Repository,
	products product.Repository,
	recipes recipe.Repository,
) *Service {
	return &Service{
		db:           db,
		transactions: transactions,
		products:     products,
		recipes:      recipes,
	}
}

func (s *Service) Create(req CreateTransactionRequest, userID uint) (*TransactionResponse, error) {
	if len(req.Items) == 0 {
		return nil, ErrEmptyItems
	}

	quantities := make(map[uint]int)
	productIDs := make([]uint, 0, len(req.Items))

	for _, item := range req.Items {
		if item.Quantity <= 0 {
			return nil, ErrInvalidQuantity
		}
		if _, exists := quantities[item.ProductID]; !exists {
			productIDs = append(productIDs, item.ProductID)
		}
		quantities[item.ProductID] += item.Quantity
	}

	products, err := s.products.FindByIDs(productIDs)
	if err != nil {
		return nil, err
	}
	if len(products) != len(productIDs) {
		return nil, product.ErrProductNotFound
	}

	productMap := make(map[uint]*product.Product, len(products))
	for i := range products {
		item := &products[i]
		if !item.IsAvailable {
			return nil, fmt.Errorf("%w: %s", ErrProductUnavailable, item.Name)
		}
		productMap[item.ID] = item
	}

	var subtotal int64
	items := make([]TransactionItem, 0, len(productIDs))

	for _, productID := range productIDs {
		item := productMap[productID]
		quantity := quantities[productID]
		lineTotal := item.Price * int64(quantity)
		subtotal += lineTotal

		items = append(items, TransactionItem{
			ProductID:   item.ID,
			ProductName: item.Name,
			Quantity:    quantity,
			Price:       item.Price,
			Subtotal:    lineTotal,
		})
	}

	if req.Discount > subtotal {
		return nil, ErrInvalidDiscount
	}

	total := subtotal - req.Discount
	if req.PaymentAmount < total {
		return nil, ErrInsufficientPayment
	}

	recipes, err := s.recipes.FindByProductIDs(productIDs)
	if err != nil {
		return nil, err
	}

	required := make(map[uint]decimal.Decimal)
	ingredientIDs := make([]uint, 0)

	for i := range recipes {
		item := &recipes[i]
		if item.Ingredient == nil {
			continue
		}

		quantity := quantities[item.ProductID]
		need := item.Quantity.Mul(decimal.NewFromInt(int64(quantity)))

		if _, exists := required[item.IngredientID]; !exists {
			ingredientIDs = append(ingredientIDs, item.IngredientID)
		}
		required[item.IngredientID] = required[item.IngredientID].Add(need)
	}

	invoiceNumber := generateInvoiceNumber()
	paidAt := time.Now()

	var createdID uint

	err = s.db.Transaction(func(tx *gorm.DB) error {
		ingredients := ingredient.NewRepository(tx)
		transactions := NewRepository(tx)
		stocks := stock.NewRepository(tx)

		locked, err := ingredients.FindByIDsForUpdate(ingredientIDs)
		if err != nil {
			return err
		}

		stockByID := make(map[uint]*ingredient.Ingredient, len(locked))
		for i := range locked {
			stockByID[locked[i].ID] = &locked[i]
		}

		for ingredientID, need := range required {
			current, ok := stockByID[ingredientID]
			if !ok {
				return ingredient.ErrIngredientNotFound
			}
			if current.Stock.LessThan(need) {
				return fmt.Errorf(
					"%w: %s requires %s %s, available %s %s",
					ErrInsufficientStock,
					current.Name,
					need,
					unitAbbreviation(current),
					current.Stock,
					unitAbbreviation(current),
				)
			}
		}

		transaction := &Transaction{
			UserID:        userID,
			InvoiceNumber: invoiceNumber,
			Subtotal:      subtotal,
			Discount:      req.Discount,
			Total:         total,
			Status:        TransactionStatusPaid,
		}

		if err := transactions.Create(transaction); err != nil {
			return err
		}

		for i := range items {
			items[i].TransactionID = transaction.ID
		}

		if err := transactions.CreateItems(items); err != nil {
			return err
		}

		payment := &Payment{
			TransactionID: transaction.ID,
			Method:        req.PaymentMethod,
			Amount:        req.PaymentAmount,
			Status:        PaymentStatusSuccess,
			PaidAt:        &paidAt,
		}

		if err := transactions.CreatePayment(payment); err != nil {
			return err
		}

		referenceType := "transaction"

		for ingredientID, need := range required {
			current := stockByID[ingredientID]
			newStock := current.Stock.Sub(need)

			if err := ingredients.UpdateStock(ingredientID, newStock); err != nil {
				return err
			}

			notes := "sale " + invoiceNumber
			movement := &stock.StockMovement{
				IngredientID:  ingredientID,
				Type:          stock.StockMovementTypeSale,
				Quantity:      need,
				Notes:         &notes,
				ReferenceType: &referenceType,
				ReferenceID:   &transaction.ID,
			}

			if err := stocks.Create(movement); err != nil {
				return err
			}
		}

		createdID = transaction.ID
		return nil
	})
	if err != nil {
		return nil, err
	}

	created, err := s.transactions.FindByID(createdID)
	if err != nil {
		return nil, err
	}

	res := toResponse(created)
	return &res, nil
}

func (s *Service) GetAll(query ListTransactionsQuery) (*TransactionListResponse, error) {
	page, limit := pagination.Normalize(query.Page, query.Limit)

	filter := Filter{
		UserID: query.UserID,
	}

	if query.Status != "" {
		status := TransactionStatus(query.Status)
		if !isValidStatus(status) {
			return nil, ErrInvalidStatus
		}
		filter.Status = &status
	}

	dateFrom, dateTo, err := parseDateRange(query.DateFrom, query.DateTo)
	if err != nil {
		return nil, err
	}
	filter.DateFrom = dateFrom
	filter.DateTo = dateTo

	transactions, total, err := s.transactions.FindAll(filter, pagination.Offset(page, limit), limit)
	if err != nil {
		return nil, err
	}

	items := make([]TransactionResponse, 0, len(transactions))
	for i := range transactions {
		items = append(items, toResponse(&transactions[i]))
	}

	return &TransactionListResponse{
		Items:      items,
		Pagination: pagination.NewMeta(total, page, limit),
	}, nil
}

func (s *Service) GetByID(id uint) (*TransactionResponse, error) {
	transaction, err := s.transactions.FindByID(id)
	if err != nil {
		return nil, err
	}

	res := toResponse(transaction)
	return &res, nil
}

func (s *Service) Cancel(id uint) (*TransactionResponse, error) {
	err := s.db.Transaction(func(tx *gorm.DB) error {
		transactions := NewRepository(tx)
		ingredients := ingredient.NewRepository(tx)
		stocks := stock.NewRepository(tx)

		transaction, err := transactions.FindByIDForUpdate(id)
		if err != nil {
			return err
		}

		if transaction.Status == TransactionStatusCancelled {
			return ErrTransactionAlreadyCancelled
		}

		movements, err := stocks.FindByReference("transaction", id, stock.StockMovementTypeSale)
		if err != nil {
			return err
		}

		referenceType := "transaction"

		for i := range movements {
			movement := &movements[i]

			current, err := ingredients.FindByIDForUpdate(movement.IngredientID)
			if err != nil {
				return err
			}

			newStock := current.Stock.Add(movement.Quantity)
			if err := ingredients.UpdateStock(current.ID, newStock); err != nil {
				return err
			}

			notes := "cancel " + transaction.InvoiceNumber
			reversal := &stock.StockMovement{
				IngredientID:  current.ID,
				Type:          stock.StockMovementTypeReversal,
				Quantity:      movement.Quantity,
				Notes:         &notes,
				ReferenceType: &referenceType,
				ReferenceID:   &transaction.ID,
			}

			if err := stocks.Create(reversal); err != nil {
				return err
			}
		}

		return transactions.UpdateStatus(id, TransactionStatusCancelled)
	})
	if err != nil {
		return nil, err
	}

	updated, err := s.transactions.FindByID(id)
	if err != nil {
		return nil, err
	}

	res := toResponse(updated)
	return &res, nil
}

func parseDateRange(from, to string) (*time.Time, *time.Time, error) {
	var dateFrom, dateTo *time.Time

	if from != "" {
		parsed, err := time.ParseInLocation("2006-01-02", from, time.Local)
		if err != nil {
			return nil, nil, ErrInvalidDate
		}
		dateFrom = &parsed
	}

	if to != "" {
		parsed, err := time.ParseInLocation("2006-01-02", to, time.Local)
		if err != nil {
			return nil, nil, ErrInvalidDate
		}
		end := parsed.AddDate(0, 0, 1)
		dateTo = &end
	}

	return dateFrom, dateTo, nil
}

func isValidStatus(status TransactionStatus) bool {
	switch status {
	case TransactionStatusPending, TransactionStatusPaid, TransactionStatusCancelled:
		return true
	}

	return false
}

func generateInvoiceNumber() string {
	buffer := make([]byte, 4)
	if _, err := rand.Read(buffer); err != nil {
		return fmt.Sprintf("INV-%s-%d", time.Now().Format("20060102"), time.Now().UnixNano())
	}

	return fmt.Sprintf(
		"INV-%s-%s",
		time.Now().Format("20060102"),
		strings.ToUpper(hex.EncodeToString(buffer)),
	)
}

func unitAbbreviation(item *ingredient.Ingredient) string {
	if item.Unit != nil {
		return item.Unit.Abbreviation
	}

	return ""
}
