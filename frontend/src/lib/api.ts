import axios from "axios"

import { useAuthStore } from "@/stores/auth"

import type {
  ApiResponse,
  AuthSession,
  Category,
  CategoryInput,
  Ingredient,
  IngredientInput,
  ListResponse,
  LowStockReport,
  Product,
  ProductInput,
  Recipe,
  RecipeInput,
  ReportSummary,
  Role,
  SalesReport,
  StockMovement,
  StockMovementInput,
  StockUpdate,
  TopProductsReport,
  Transaction,
  TransactionInput,
  Unit,
  UnitInput,
  User,
  UserInput,
} from "@/types"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/login")) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  },
)

function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    api.post<ApiResponse<AuthSession>>("/auth/login", body).then(unwrap),
  register: (body: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<AuthSession>>("/auth/register", body).then(unwrap),
  me: () => api.get<ApiResponse<User>>("/auth/me").then(unwrap),
}

export const categoryApi = {
  list: () => api.get<ApiResponse<Category[]>>("/categories").then(unwrap),
  create: (body: CategoryInput) =>
    api.post<ApiResponse<Category>>("/categories", body).then(unwrap),
  update: (id: number, body: CategoryInput) =>
    api.put<ApiResponse<Category>>(`/categories/${id}`, body).then(unwrap),
  remove: (id: number) => api.delete(`/categories/${id}`),
}

export const productApi = {
  list: (params: Record<string, unknown> = {}) =>
    api
      .get<ApiResponse<ListResponse<Product>>>("/products", { params })
      .then(unwrap),
  get: (id: number) => api.get<ApiResponse<Product>>(`/products/${id}`).then(unwrap),
  create: (body: ProductInput) =>
    api.post<ApiResponse<Product>>("/products", body).then(unwrap),
  update: (id: number, body: ProductInput) =>
    api.put<ApiResponse<Product>>(`/products/${id}`, body).then(unwrap),
  remove: (id: number) => api.delete(`/products/${id}`),
}

export const unitApi = {
  list: () => api.get<ApiResponse<Unit[]>>("/units").then(unwrap),
  create: (body: UnitInput) =>
    api.post<ApiResponse<Unit>>("/units", body).then(unwrap),
  update: (id: number, body: UnitInput) =>
    api.put<ApiResponse<Unit>>(`/units/${id}`, body).then(unwrap),
  remove: (id: number) => api.delete(`/units/${id}`),
}

export const ingredientApi = {
  list: (params: Record<string, unknown> = {}) =>
    api
      .get<ApiResponse<ListResponse<Ingredient>>>("/ingredients", { params })
      .then(unwrap),
  get: (id: number) =>
    api.get<ApiResponse<Ingredient>>(`/ingredients/${id}`).then(unwrap),
  create: (body: IngredientInput) =>
    api.post<ApiResponse<Ingredient>>("/ingredients", body).then(unwrap),
  update: (id: number, body: IngredientInput) =>
    api.put<ApiResponse<Ingredient>>(`/ingredients/${id}`, body).then(unwrap),
  remove: (id: number) => api.delete(`/ingredients/${id}`),
}

export const stockApi = {
  list: (params: Record<string, unknown> = {}) =>
    api
      .get<ApiResponse<ListResponse<StockMovement>>>("/stock-movements", { params })
      .then(unwrap),
  create: (body: StockMovementInput) =>
    api
      .post<ApiResponse<StockUpdate>>("/stock-movements", body)
      .then(unwrap),
}

export const recipeApi = {
  list: (productId: number) =>
    api
      .get<ApiResponse<Recipe[]>>("/recipes", {
        params: { product_id: productId },
      })
      .then(unwrap),
  create: (body: RecipeInput) =>
    api.post<ApiResponse<Recipe>>("/recipes", body).then(unwrap),
  update: (id: number, body: { quantity: number }) =>
    api.put<ApiResponse<Recipe>>(`/recipes/${id}`, body).then(unwrap),
  remove: (id: number) => api.delete(`/recipes/${id}`),
}

export const transactionApi = {
  list: (params: Record<string, unknown> = {}) =>
    api
      .get<ApiResponse<ListResponse<Transaction>>>("/transactions", { params })
      .then(unwrap),
  get: (id: number) =>
    api.get<ApiResponse<Transaction>>(`/transactions/${id}`).then(unwrap),
  create: (body: TransactionInput) =>
    api.post<ApiResponse<Transaction>>("/transactions", body).then(unwrap),
  cancel: (id: number) =>
    api.delete<ApiResponse<Transaction>>(`/transactions/${id}`).then(unwrap),
}

export const reportApi = {
  summary: () => api.get<ApiResponse<ReportSummary>>("/reports/summary").then(unwrap),
  sales: (params: { from: string; to: string }) =>
    api.get<ApiResponse<SalesReport>>("/reports/sales", { params }).then(unwrap),
  topProducts: (params: { from: string; to: string; limit?: number }) =>
    api
      .get<ApiResponse<TopProductsReport>>("/reports/top-products", { params })
      .then(unwrap),
  lowStock: () =>
    api.get<ApiResponse<LowStockReport>>("/reports/low-stock").then(unwrap),
}

export const userApi = {
  list: () => api.get<ApiResponse<User[]>>("/users").then(unwrap),
  create: (body: UserInput) =>
    api.post<ApiResponse<User>>("/users", body).then(unwrap),
  update: (id: number, body: UserInput) =>
    api.put<ApiResponse<User>>(`/users/${id}`, body).then(unwrap),
  deactivate: (id: number) => api.delete(`/users/${id}`),
  roles: () => api.get<ApiResponse<Role[]>>("/roles").then(unwrap),
}
