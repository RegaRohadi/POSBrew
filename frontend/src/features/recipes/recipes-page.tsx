import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { PageHeader } from "@/components/ui/page-header"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ingredientApi, productApi, recipeApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatCurrency, formatNumber } from "@/lib/format"
import { useAuthStore } from "@/stores/auth"
import type { Ingredient, Product, Recipe, RecipeInput } from "@/types"

export function RecipesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((state) => state.user?.role?.name === "admin")

  const [productId, setProductId] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null)

  const productsQuery = useQuery({
    queryKey: ["products", "options"],
    queryFn: () => productApi.list({ page: 1, limit: 100 }),
  })
  const ingredientsQuery = useQuery({
    queryKey: ["ingredients", "options"],
    queryFn: () => ingredientApi.list({ page: 1, limit: 100 }),
  })
  const recipesQuery = useQuery({
    queryKey: ["recipes", productId],
    queryFn: () => recipeApi.list(Number(productId)),
    enabled: Boolean(productId),
  })

  const products = productsQuery.data?.items ?? []
  const ingredients = ingredientsQuery.data?.items ?? []
  const recipes = recipesQuery.data ?? []
  const selectedProduct = products.find(
    (product) => String(product.id) === productId,
  )

  useEffect(() => {
    if (!productId && products.length > 0) {
      setProductId(String(products[0].id))
    }
  }, [products, productId])

  const saveMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id?: number
      body: RecipeInput | { quantity: number }
    }) =>
      id
        ? recipeApi.update(id, body as { quantity: number })
        : recipeApi.create(body as RecipeInput),
    onSuccess: (_data, variables) => {
      toast.success(
        t(variables.id ? "messages.updated" : "messages.created", {
          entity: t("entities.recipe"),
        }),
      )
      void queryClient.invalidateQueries({ queryKey: ["recipes", productId] })
      setFormOpen(false)
      setEditing(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => recipeApi.remove(id),
    onSuccess: () => {
      toast.success(t("messages.deleted", { entity: t("entities.recipe") }))
      void queryClient.invalidateQueries({ queryKey: ["recipes", productId] })
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  return (
    <div className="space-y-7">
      <PageHeader
        title={t("recipes.title")}
        description={t("recipes.subtitle")}
        actions={
          isAdmin ? (
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
              disabled={!productId}
            >
              <Plus className="h-4 w-4" />
              {t("recipes.addIngredient")}
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.4fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t("recipes.selectProduct")}</CardTitle>
            <CardDescription>{t("recipes.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <option value="">{t("recipes.selectProduct")}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>

            {selectedProduct ? (
              <div className="space-y-3 rounded-xl border border-border bg-cream/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-muted">
                      {t("recipes.productCard")}
                    </p>
                    <p className="mt-1 font-display text-xl font-semibold">
                      {selectedProduct.name}
                    </p>
                  </div>
                  <Badge
                    variant={
                      selectedProduct.is_available ? "success" : "neutral"
                    }
                  >
                    {selectedProduct.is_available
                      ? t("common.available")
                      : t("common.unavailable")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted">{t("recipes.price")}</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedProduct.price)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{t("common.category")}</span>
                  <span className="font-medium">
                    {selectedProduct.category?.name ?? t("products.noCategory")}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title={t("recipes.noProduct")}
                description={t("recipes.noProductHint")}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("nav.recipes")}</CardTitle>
            <CardDescription>
              {recipes.length} {t("common.items")}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-2">
            {recipesQuery.isLoading ? (
              <div className="space-y-3 px-5 pb-5 sm:px-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : recipes.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={t("recipes.empty")}
                description={t("recipes.emptyHint")}
                action={
                  isAdmin && productId ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(null)
                        setFormOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      {t("recipes.addIngredient")}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                      <th className="px-5 py-3 font-semibold sm:px-6">
                        {t("recipes.ingredient")}
                      </th>
                      <th className="px-3 py-3 text-right font-semibold">
                        {t("recipes.quantity")}
                      </th>
                      {isAdmin && (
                        <th className="px-5 py-3 text-right font-semibold sm:px-6">
                          {t("common.actions")}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {recipes.map((recipe) => (
                      <tr
                        key={recipe.id}
                        className="border-b border-border/60 last:border-0 hover:bg-cream/40"
                      >
                        <td className="px-5 py-3.5 font-semibold text-espresso sm:px-6">
                          {recipe.ingredient?.name ?? "-"}
                        </td>
                        <td className="px-3 py-3.5 text-right font-semibold">
                          {formatNumber(recipe.quantity)}{" "}
                          <span className="text-xs font-normal text-muted">
                            {recipe.ingredient?.unit?.abbreviation ?? ""}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3.5 text-right sm:px-6">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditing(recipe)
                                  setFormOpen(true)
                                }}
                                aria-label={t("common.edit")}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-danger hover:bg-danger/10 hover:text-danger"
                                onClick={() => setDeleteTarget(recipe)}
                                aria-label={t("common.delete")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RecipeFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        productId={Number(productId)}
        editing={editing}
        ingredients={ingredients}
        existing={recipes}
        saving={saveMutation.isPending}
        onSubmit={(body) =>
          saveMutation.mutate({ id: editing?.id, body })
        }
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        title={t("recipes.deleteTitle")}
        description={t("recipes.deleteDesc")}
        confirmLabel={t("common.delete")}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

interface RecipeFormModalProps {
  open: boolean
  onClose: () => void
  productId: number
  editing: Recipe | null
  ingredients: Ingredient[]
  existing: Recipe[]
  saving: boolean
  onSubmit: (body: RecipeInput | { quantity: number }) => void
}

function RecipeFormModal({
  open,
  onClose,
  productId,
  editing,
  ingredients,
  existing,
  saving,
  onSubmit,
}: RecipeFormModalProps) {
  const { t } = useTranslation()
  const [ingredientId, setIngredientId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setIngredientId(editing ? String(editing.ingredient_id) : "")
    setQuantity(editing ? String(Number(editing.quantity)) : "")
    setError("")
  }, [open, editing])

  const usedIds = new Set(
    existing
      .filter((recipe) => recipe.id !== editing?.id)
      .map((recipe) => recipe.ingredient_id),
  )
  const availableIngredients = ingredients.filter(
    (ingredient) => !usedIds.has(ingredient.id),
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!ingredientId) {
      setError(t("validation.required"))
      return
    }
    const value = Number(quantity)
    if (!Number.isFinite(value) || value <= 0) {
      setError(t("validation.positive"))
      return
    }

    if (editing) {
      onSubmit({ quantity: value })
      return
    }

    onSubmit({
      product_id: productId,
      ingredient_id: Number(ingredientId),
      quantity: value,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t("recipes.formEdit") : t("recipes.formTitle")}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="recipe-form" loading={saving}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="recipe-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("recipes.ingredient")} required>
          <Select
            value={ingredientId}
            onChange={(event) => setIngredientId(event.target.value)}
            disabled={Boolean(editing)}
          >
            <option value="">{t("recipes.selectIngredient")}</option>
            {(editing ? ingredients : availableIngredients).map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name} ({ingredient.unit?.abbreviation ?? "-"})
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t("recipes.quantity")} hint={t("recipes.perPortion")} required>
          <Input
            type="number"
            min={0}
            step="0.001"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="0"
          />
        </Field>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}
      </form>
    </Modal>
  )
}
