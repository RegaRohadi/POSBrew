export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ListResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

export interface Role {
  id: number
  name: string
}

export interface User {
  id: number
  role_id: number
  role?: Role
  name: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthSession {
  token: string
  user: User
}

export interface Category {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Unit {
  id: number
  name: string
  abbreviation: string
  created_at: string
}

export interface UnitSummary {
  id: number
  name: string
  abbreviation: string
}

export interface Ingredient {
  id: number
  unit_id: number
  unit?: UnitSummary
  name: string
  stock: number | string
  minimum_stock: number | string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: number
  name: string
}

export interface Product {
  id: number
  category_id: number | null
  category?: ProductCategory
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: number
  product_id: number
  product?: { id: number; name: string }
  ingredient_id: number
  ingredient?: {
    id: number
    name: string
    unit?: UnitSummary
  }
  quantity: number | string
  created_at: string
  updated_at: string
}

export type StockMovementType =
  | "purchase"
  | "sale"
  | "adjustment"
  | "waste"
  | "reversal"

export interface StockMovement {
  id: number
  ingredient_id: number
  ingredient?: { id: number; name: string }
  type: StockMovementType
  quantity: number | string
  notes: string | null
  reference_type: string | null
  reference_id: number | null
  created_at: string
}

export interface StockUpdate {
  ingredient_id: number
  stock: number | string
  movement?: StockMovement
}

export type PaymentMethod = "cash" | "qris" | "debit"
export type PaymentStatus = "pending" | "success" | "failed"
export type TransactionStatus = "pending" | "paid" | "cancelled"

export interface TransactionItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  price: number
  subtotal: number
}

export interface Payment {
  id: number
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  paid_at: string | null
}

export interface Transaction {
  id: number
  invoice_number: string
  user_id: number
  user_name?: string
  subtotal: number
  discount: number
  total: number
  change: number
  status: TransactionStatus
  items?: TransactionItem[]
  payment?: Payment
  created_at: string
  updated_at: string
}

export interface ReportSummary {
  today_revenue: number
  today_transactions: number
  month_revenue: number
  month_transactions: number
  total_revenue: number
  total_transactions: number
  low_stock_ingredients: number
}

export interface DailySales {
  date: string
  revenue: number
  transactions: number
}

export interface SalesReport {
  from: string
  to: string
  items: DailySales[]
}

export interface TopProduct {
  product_id: number
  product_name: string
  quantity_sold: number
  revenue: number
}

export interface TopProductsReport {
  from: string
  to: string
  items: TopProduct[]
}

export interface LowStockItem {
  id: number
  name: string
  unit: string
  stock: number | string
  minimum_stock: number | string
}

export interface LowStockReport {
  items: LowStockItem[]
}

export interface CategoryInput {
  name: string
  description?: string | null
}

export interface UnitInput {
  name: string
  abbreviation: string
}

export interface IngredientInput {
  unit_id: number
  name: string
  minimum_stock: number
  is_active?: boolean
}

export interface ProductInput {
  category_id: number | null
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  is_available: boolean
}

export interface RecipeInput {
  product_id: number
  ingredient_id: number
  quantity: number
}

export interface StockMovementInput {
  ingredient_id: number
  type: "purchase" | "waste" | "adjustment"
  quantity?: number
  target_stock?: number
  notes?: string
}

export interface TransactionInput {
  items: Array<{ product_id: number; quantity: number }>
  discount: number
  payment_method: PaymentMethod
  payment_amount: number
}

export interface UserInput {
  role_id: number
  name: string
  email: string
  password?: string
  is_active?: boolean
}
