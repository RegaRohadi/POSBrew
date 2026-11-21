import { lazy, type ReactNode } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/layout/app-layout"
import { LoginPage } from "@/features/auth/login-page"
import { NotFoundPage } from "@/features/not-found-page"
import { useAuthStore } from "@/stores/auth"

const DashboardPage = lazy(() =>
  import("@/features/dashboard/dashboard-page").then((module) => ({
    default: module.DashboardPage,
  })),
)
const PosPage = lazy(() =>
  import("@/features/pos/pos-page").then((module) => ({
    default: module.PosPage,
  })),
)
const ProductsPage = lazy(() =>
  import("@/features/products/products-page").then((module) => ({
    default: module.ProductsPage,
  })),
)
const CategoriesPage = lazy(() =>
  import("@/features/categories/categories-page").then((module) => ({
    default: module.CategoriesPage,
  })),
)
const UnitsPage = lazy(() =>
  import("@/features/units/units-page").then((module) => ({
    default: module.UnitsPage,
  })),
)
const IngredientsPage = lazy(() =>
  import("@/features/ingredients/ingredients-page").then((module) => ({
    default: module.IngredientsPage,
  })),
)
const StockPage = lazy(() =>
  import("@/features/stock/stock-page").then((module) => ({
    default: module.StockPage,
  })),
)
const RecipesPage = lazy(() =>
  import("@/features/recipes/recipes-page").then((module) => ({
    default: module.RecipesPage,
  })),
)
const TransactionsPage = lazy(() =>
  import("@/features/transactions/transactions-page").then((module) => ({
    default: module.TransactionsPage,
  })),
)
const ReportsPage = lazy(() =>
  import("@/features/reports/reports-page").then((module) => ({
    default: module.ReportsPage,
  })),
)
const UsersPage = lazy(() =>
  import("@/features/users/users-page").then((module) => ({
    default: module.UsersPage,
  })),
)

function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <AppLayout />
}

function AdminRoute({ children }: { children: ReactNode }) {
  const isAdmin = useAuthStore((state) => state.user?.role?.name === "admin")
  if (!isAdmin) {
    return <Navigate to="/pos" replace />
  }
  return <>{children}</>
}

function HomeRoute() {
  const isAdmin = useAuthStore((state) => state.user?.role?.name === "admin")
  if (!isAdmin) {
    return <Navigate to="/pos" replace />
  }
  return <DashboardPage />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/pos" element={<PosPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route
          path="/categories"
          element={
            <AdminRoute>
              <CategoriesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/units"
          element={
            <AdminRoute>
              <UnitsPage />
            </AdminRoute>
          }
        />
        <Route path="/ingredients" element={<IngredientsPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route
          path="/reports"
          element={
            <AdminRoute>
              <ReportsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
