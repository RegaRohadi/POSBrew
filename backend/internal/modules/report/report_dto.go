package report

import "github.com/shopspring/decimal"

type SummaryResponse struct {
	TodayRevenue        int64 `json:"today_revenue"`
	TodayTransactions   int64 `json:"today_transactions"`
	MonthRevenue        int64 `json:"month_revenue"`
	MonthTransactions   int64 `json:"month_transactions"`
	TotalRevenue        int64 `json:"total_revenue"`
	TotalTransactions   int64 `json:"total_transactions"`
	LowStockIngredients int64 `json:"low_stock_ingredients"`
}

type DailySalesItem struct {
	Date         string `json:"date"`
	Revenue      int64  `json:"revenue"`
	Transactions int64  `json:"transactions"`
}

type SalesResponse struct {
	From  string           `json:"from"`
	To    string           `json:"to"`
	Items []DailySalesItem `json:"items"`
}

type TopProductItem struct {
	ProductID    uint   `json:"product_id"`
	ProductName  string `json:"product_name"`
	QuantitySold int64  `json:"quantity_sold"`
	Revenue      int64  `json:"revenue"`
}

type TopProductsResponse struct {
	From  string           `json:"from"`
	To    string           `json:"to"`
	Items []TopProductItem `json:"items"`
}

type LowStockItem struct {
	ID           uint            `json:"id"`
	Name         string          `json:"name"`
	Unit         string          `json:"unit"`
	Stock        decimal.Decimal `json:"stock"`
	MinimumStock decimal.Decimal `json:"minimum_stock"`
}

type LowStockResponse struct {
	Items []LowStockItem `json:"items"`
}

type DateRangeQuery struct {
	From string `form:"from"`
	To   string `form:"to"`
}

type TopProductsQuery struct {
	From  string `form:"from"`
	To    string `form:"to"`
	Limit int    `form:"limit"`
}
