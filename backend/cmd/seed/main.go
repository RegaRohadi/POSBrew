package main

import (
	"flag"
	"fmt"
	"log"
	"math/rand"
	"time"

	"POSBrew/internal/config"
	"POSBrew/internal/database"
	"POSBrew/internal/modules/category"
	"POSBrew/internal/modules/ingredient"
	"POSBrew/internal/modules/product"
	"POSBrew/internal/modules/recipe"
	"POSBrew/internal/modules/stock"
	"POSBrew/internal/modules/transaction"
	"POSBrew/internal/modules/unit"
	"POSBrew/internal/modules/user"

	"github.com/shopspring/decimal"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	adminEmail   = "admin@posbrew.test"
	adminPass    = "admin123"
	cashierEmail = "cashier@posbrew.test"
	cashierPass  = "cashier123"
)

type ingredientSeed struct {
	Name    string
	Unit    string
	Stock   int64
	Minimum int64
}

type productSeed struct {
	Name        string
	Category    string
	Price       int64
	Description string
	Recipe      map[string]int64
}

// Demo photos live in frontend/public/products. Keeping the paths here means a
// reseed fills image_url for the starter catalog, and a plain seed run can
// backfill photos on an existing demo database without touching sales data.
var demoProductImages = map[string]string{
	"Espresso":            "/products/espresso.jpg",
	"Americano":           "/products/americano.jpg",
	"Cappuccino":          "/products/cappuccino.jpg",
	"Latte":               "/products/latte.jpg",
	"Mocha":               "/products/mocha.jpg",
	"Matcha Latte":        "/products/matcha-latte.jpg",
	"Chocolate":           "/products/hot-chocolate.jpg",
	"Lychee Tea":          "/products/lychee-tea.jpg",
	"Lemon Tea":           "/products/lemon-tea.jpg",
	"Croissant":           "/products/croissant.jpg",
	"Chocolate Croissant": "/products/chocolate-croissant.jpg",
	"French Fries":        "/products/french-fries.jpg",
}

type seededSale struct {
	Transaction *transaction.Transaction
	At          time.Time
	Usage       map[string]decimal.Decimal
}

func main() {
	reset := flag.Bool("reset", false, "hapus seluruh data demo lalu seed ulang")
	flag.Parse()

	cfg := config.Load()
	db := database.Connect(cfg)

	if err := run(db, *reset); err != nil {
		log.Fatalf("seed failed: %v", err)
	}

	log.Println("seed selesai")
}

func run(db *gorm.DB, reset bool) error {
	var existing int64
	if err := db.Model(&user.User{}).Where("email = ?", adminEmail).Count(&existing).Error; err != nil {
		return err
	}

	if existing > 0 && !reset {
		if err := syncDemoProductImages(db); err != nil {
			return err
		}
		log.Println("data demo sudah ada, foto produk disinkronkan; gunakan -reset kalau ingin membuat ulang")
		return nil
	}

	if reset {
		log.Println("menghapus data demo lama...")
		if err := db.Exec(`TRUNCATE TABLE transaction_items, payments, transactions, stock_movements, recipes, ingredients, products, categories, users RESTART IDENTITY CASCADE`).Error; err != nil {
			return err
		}
	}

	return db.Transaction(seed)
}

func seed(db *gorm.DB) error {
	now := time.Now()

	var adminRole, cashierRole user.Role
	if err := db.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		return fmt.Errorf("role admin belum ada, jalankan migrasi seed: %w", err)
	}
	if err := db.Where("name = ?", "cashier").First(&cashierRole).Error; err != nil {
		return fmt.Errorf("role cashier belum ada, jalankan migrasi seed: %w", err)
	}

	var units []unit.Unit
	if err := db.Find(&units).Error; err != nil {
		return err
	}
	unitByAbbr := make(map[string]*unit.Unit, len(units))
	for i := range units {
		unitByAbbr[units[i].Abbreviation] = &units[i]
	}

	admin, err := createUser(db, adminRole.ID, "Admin POSBrew", adminEmail, adminPass)
	if err != nil {
		return err
	}
	cashier, err := createUser(db, cashierRole.ID, "Cashier POSBrew", cashierEmail, cashierPass)
	if err != nil {
		return err
	}

	categoryNames := []struct {
		Name        string
		Description string
	}{
		{"Coffee", "Espresso based drinks"},
		{"Non Coffee", "Chocolate and matcha drinks"},
		{"Tea", "Tea based drinks"},
		{"Pastry", "Fresh bakery items"},
		{"Snack", "Light bites"},
	}

	categoryByName := make(map[string]*category.Category, len(categoryNames))
	for _, item := range categoryNames {
		record := &category.Category{
			Name:        item.Name,
			Description: stringPtr(item.Description),
		}
		if err := db.Create(record).Error; err != nil {
			return err
		}
		categoryByName[item.Name] = record
	}

	ingredientSeeds := []ingredientSeed{
		{"Espresso Beans", "g", 10000, 1500},
		{"Fresh Milk", "ml", 20000, 3000},
		{"Sugar", "g", 5000, 800},
		{"Chocolate Syrup", "ml", 4000, 600},
		{"Matcha Powder", "g", 900, 300},
		{"Lychee Syrup", "ml", 3000, 400},
		{"Tea Bag", "pcs", 300, 50},
		{"Flour", "g", 8000, 1000},
		{"Butter", "g", 4000, 600},
		{"Potato", "g", 6000, 1000},
		{"Lemon", "pcs", 120, 20},
	}

	ingredientByName := make(map[string]*ingredient.Ingredient, len(ingredientSeeds))
	for _, item := range ingredientSeeds {
		unitRecord, ok := unitByAbbr[item.Unit]
		if !ok {
			return fmt.Errorf("unit %s belum ada", item.Unit)
		}

		record := &ingredient.Ingredient{
			UnitID:       unitRecord.ID,
			Name:         item.Name,
			Stock:        decimal.NewFromInt(item.Stock),
			MinimumStock: decimal.NewFromInt(item.Minimum),
			IsActive:     true,
		}
		if err := db.Omit("Unit").Create(record).Error; err != nil {
			return err
		}
		ingredientByName[item.Name] = record
	}

	productSeeds := []productSeed{
		{"Espresso", "Coffee", 18000, "Double shot espresso", map[string]int64{"Espresso Beans": 18}},
		{"Americano", "Coffee", 22000, "Espresso with hot water", map[string]int64{"Espresso Beans": 18}},
		{"Cappuccino", "Coffee", 28000, "Espresso, steamed milk and foam", map[string]int64{"Espresso Beans": 18, "Fresh Milk": 120}},
		{"Latte", "Coffee", 28000, "Espresso with silky milk", map[string]int64{"Espresso Beans": 18, "Fresh Milk": 150}},
		{"Mocha", "Coffee", 32000, "Chocolate espresso latte", map[string]int64{"Espresso Beans": 18, "Fresh Milk": 150, "Chocolate Syrup": 30}},
		{"Matcha Latte", "Non Coffee", 30000, "Japanese matcha with milk", map[string]int64{"Matcha Powder": 8, "Fresh Milk": 180, "Sugar": 10}},
		{"Chocolate", "Non Coffee", 26000, "Rich hot chocolate", map[string]int64{"Chocolate Syrup": 40, "Fresh Milk": 180}},
		{"Lychee Tea", "Tea", 24000, "Lychee syrup with brewed tea", map[string]int64{"Lychee Syrup": 30, "Tea Bag": 1}},
		{"Lemon Tea", "Tea", 20000, "Fresh lemon tea", map[string]int64{"Lemon": 1, "Tea Bag": 1, "Sugar": 15}},
		{"Croissant", "Pastry", 20000, "Butter croissant", map[string]int64{"Flour": 80, "Butter": 30}},
		{"Chocolate Croissant", "Pastry", 24000, "Croissant with chocolate filling", map[string]int64{"Flour": 80, "Butter": 30, "Chocolate Syrup": 20}},
		{"French Fries", "Snack", 22000, "Crispy shoestring fries", map[string]int64{"Potato": 200}},
	}

	productByName := make(map[string]*product.Product, len(productSeeds))
	for _, item := range productSeeds {
		categoryRecord := categoryByName[item.Category]
		record := &product.Product{
			CategoryID:  &categoryRecord.ID,
			Name:        item.Name,
			Description: stringPtr(item.Description),
			Price:       item.Price,
			ImageURL:    stringPtr(demoProductImages[item.Name]),
			IsAvailable: true,
		}
		if err := db.Omit("Category").Create(record).Error; err != nil {
			return err
		}
		productByName[item.Name] = record
	}

	for _, item := range productSeeds {
		for ingredientName, quantity := range item.Recipe {
			ingredientRecord := ingredientByName[ingredientName]
			record := &recipe.Recipe{
				ProductID:    productByName[item.Name].ID,
				IngredientID: ingredientRecord.ID,
				Quantity:     decimal.NewFromInt(quantity),
			}
			if err := db.Omit("Product", "Ingredient").Create(record).Error; err != nil {
				return err
			}
		}
	}

	sales, err := createSales(db, now, productByName, productSeeds, admin.ID, cashier.ID)
	if err != nil {
		return err
	}

	usage := make(map[string]decimal.Decimal)
	for _, sale := range sales {
		for name, quantity := range sale.Usage {
			usage[name] = usage[name].Add(quantity)
		}
	}

	waste := map[string]decimal.Decimal{
		"Fresh Milk": decimal.NewFromInt(250),
		"Flour":      decimal.NewFromInt(120),
	}

	lowStockTargets := map[string]decimal.Decimal{
		"Matcha Powder": decimal.NewFromInt(120),
		"Butter":        decimal.NewFromInt(400),
	}

	for _, item := range ingredientSeeds {
		record := ingredientByName[item.Name]
		initial := decimal.NewFromInt(item.Stock)
		final := initial.Sub(usage[item.Name]).Sub(waste[item.Name])
		if final.IsNegative() {
			final = decimal.Zero
		}

		adjustment := decimal.Zero
		if target, ok := lowStockTargets[item.Name]; ok {
			adjustment = target.Sub(final)
			final = target
		}

		if err := db.Model(&ingredient.Ingredient{}).Where("id = ?", record.ID).Update("stock", final).Error; err != nil {
			return err
		}

		purchase := &stock.StockMovement{
			IngredientID: record.ID,
			Type:         stock.StockMovementTypePurchase,
			Quantity:     initial,
			Notes:        stringPtr("initial stock (demo)"),
			CreatedAt:    now.AddDate(0, 0, -21),
		}
		if err := db.Omit("Ingredient").Create(purchase).Error; err != nil {
			return err
		}

		if !adjustment.IsZero() {
			adjustmentRecord := &stock.StockMovement{
				IngredientID: record.ID,
				Type:         stock.StockMovementTypeAdjustment,
				Quantity:     adjustment.Abs(),
				Notes:        stringPtr("stock opname (demo)"),
				CreatedAt:    now.AddDate(0, 0, -1),
			}
			if err := db.Omit("Ingredient").Create(adjustmentRecord).Error; err != nil {
				return err
			}
		}
	}

	for _, sale := range sales {
		referenceType := "transaction"
		for ingredientName, quantity := range sale.Usage {
			record := ingredientByName[ingredientName]
			movement := &stock.StockMovement{
				IngredientID:  record.ID,
				Type:          stock.StockMovementTypeSale,
				Quantity:      quantity,
				Notes:         stringPtr("sale " + sale.Transaction.InvoiceNumber),
				ReferenceType: &referenceType,
				ReferenceID:   &sale.Transaction.ID,
				CreatedAt:     sale.At.Add(4 * time.Minute),
			}
			if err := db.Omit("Ingredient").Create(movement).Error; err != nil {
				return err
			}
		}
	}

	for ingredientName, quantity := range waste {
		record := ingredientByName[ingredientName]
		movement := &stock.StockMovement{
			IngredientID: record.ID,
			Type:         stock.StockMovementTypeWaste,
			Quantity:     quantity,
			Notes:        stringPtr("spilled during service (demo)"),
			CreatedAt:    now.AddDate(0, 0, -3),
		}
		if err := db.Omit("Ingredient").Create(movement).Error; err != nil {
			return err
		}
	}

	log.Printf("seed selesai: 2 user, %d kategori, %d produk, %d ingredient, %d transaksi",
		len(categoryNames), len(productSeeds), len(ingredientSeeds), len(sales))

	return nil
}

func syncDemoProductImages(db *gorm.DB) error {
	for name, image := range demoProductImages {
		if err := db.Model(&product.Product{}).
			Where("name = ? AND (image_url IS NULL OR image_url = '')", name).
			Update("image_url", image).Error; err != nil {
			return err
		}
	}
	return nil
}

func createUser(db *gorm.DB, roleID uint, name, email, password string) (*user.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	record := &user.User{
		RoleID:   roleID,
		Name:     name,
		Email:    email,
		Password: string(hash),
		IsActive: true,
	}

	if err := db.Omit("Role").Create(record).Error; err != nil {
		return nil, err
	}

	return record, nil
}

func createSales(
	db *gorm.DB,
	now time.Time,
	productByName map[string]*product.Product,
	productSeeds []productSeed,
	adminID uint,
	cashierID uint,
) ([]*seededSale, error) {
	rng := rand.New(rand.NewSource(42))
	methods := []transaction.PaymentMethod{
		transaction.PaymentMethodCash,
		transaction.PaymentMethodQRIS,
		transaction.PaymentMethodDebit,
	}

	sales := make([]*seededSale, 0, 32)
	sequence := 1

	for day := 0; day < 14; day++ {
		perDay := 2
		if day%4 == 0 {
			perDay = 3
		}

		for index := 0; index < perDay; index++ {
			at := time.Date(
				now.Year(), now.Month(), now.Day()-day,
				8+rng.Intn(11), rng.Intn(60), 0, 0, now.Location(),
			)

			cancelled := sequence == 7 || sequence == 22
			itemCount := 1 + rng.Intn(3)
			picked := make(map[int]bool, itemCount)
			items := make([]transaction.TransactionItem, 0, itemCount)
			usage := make(map[string]decimal.Decimal)
			var subtotal int64

			for len(items) < itemCount {
				productIndex := rng.Intn(len(productSeeds))
				if picked[productIndex] {
					continue
				}
				picked[productIndex] = true

				seed := productSeeds[productIndex]
				quantity := 1 + rng.Intn(2)
				record := productByName[seed.Name]
				lineTotal := record.Price * int64(quantity)
				subtotal += lineTotal

				items = append(items, transaction.TransactionItem{
					ProductID:   record.ID,
					ProductName: record.Name,
					Quantity:    quantity,
					Price:       record.Price,
					Subtotal:    lineTotal,
					CreatedAt:   at,
				})

				if !cancelled {
					for ingredientName, perUnit := range seed.Recipe {
						need := decimal.NewFromInt(perUnit * int64(quantity))
						usage[ingredientName] = usage[ingredientName].Add(need)
					}
				}
			}

			discount := int64(0)
			if rng.Intn(4) == 0 {
				discount = int64(2000 * (1 + rng.Intn(2)))
				if discount >= subtotal {
					discount = 0
				}
			}

			total := subtotal - discount
			method := methods[rng.Intn(len(methods))]
			paidAmount := total
			if method == transaction.PaymentMethodCash {
				paidAmount = roundUp(total, 10000)
				if paidAmount == total {
					paidAmount += 10000
				}
			}

			status := transaction.TransactionStatusPaid
			if cancelled {
				status = transaction.TransactionStatusCancelled
			}

			userID := cashierID
			if sequence%5 == 0 {
				userID = adminID
			}

			record := &transaction.Transaction{
				UserID:        userID,
				InvoiceNumber: fmt.Sprintf("INV-%s-%03d", at.Format("20060102"), sequence),
				Subtotal:      subtotal,
				Discount:      discount,
				Total:         total,
				Status:        status,
				CreatedAt:     at,
				UpdatedAt:     at,
			}
			if err := db.Omit("User", "Items", "Payment").Create(record).Error; err != nil {
				return nil, err
			}

			for i := range items {
				items[i].TransactionID = record.ID
			}
			if err := db.Omit("Product").Create(&items).Error; err != nil {
				return nil, err
			}

			paidAt := at.Add(3 * time.Minute)
			payment := &transaction.Payment{
				TransactionID: record.ID,
				Method:        method,
				Amount:        paidAmount,
				Status:        transaction.PaymentStatusSuccess,
				PaidAt:        &paidAt,
				CreatedAt:     at,
			}
			if err := db.Create(payment).Error; err != nil {
				return nil, err
			}

			sales = append(sales, &seededSale{
				Transaction: record,
				At:          at,
				Usage:       usage,
			})
			sequence++
		}
	}

	return sales, nil
}

func roundUp(value, step int64) int64 {
	if value <= 0 {
		return step
	}
	return ((value + step - 1) / step) * step
}

func stringPtr(value string) *string {
	return &value
}
