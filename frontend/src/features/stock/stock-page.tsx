import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeftRight, Plus, SlidersHorizontal } from "lucide-react"
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
import { EmptyState } from "@/components/ui/empty-state"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { MovementTypeBadge } from "@/components/ui/status-badge"
import { Textarea } from "@/components/ui/textarea"
import { ingredientApi, stockApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDateTime, formatNumber } from "@/lib/format"
import { useAuthStore } from "@/stores/auth"
import type { StockMovementInput } from "@/types"

const movementTypes = ["purchase", "waste", "adjustment"] as const

export function StockPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((state) => state.user?.role?.name === "admin")

  const [page, setPage] = useState(1)
  const [ingredientFilter, setIngredientFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const ingredientsQuery = useQuery({
    queryKey: ["ingredients", "options"],
    queryFn: () => ingredientApi.list({ page: 1, limit: 100 }),
  })
  const movementsQuery = useQuery({
    queryKey: ["stock-movements", page, ingredientFilter, typeFilter],
    queryFn: () =>
      stockApi.list({
        page,
        limit: 10,
        ingredient_id: ingredientFilter || undefined,
        type: typeFilter || undefined,
      }),
  })

  const ingredients = ingredientsQuery.data?.items ?? []
  const movements = movementsQuery.data?.items ?? []
  const meta = movementsQuery.data?.pagination

  const createMutation = useMutation({
    mutationFn: (body: StockMovementInput) => stockApi.create(body),
    onSuccess: () => {
      toast.success(t("stock.success"))
      void queryClient.invalidateQueries({ queryKey: ["stock-movements"] })
      void queryClient.invalidateQueries({ queryKey: ["ingredients"] })
      void queryClient.invalidateQueries({ queryKey: ["reports"] })
      setFormOpen(false)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  return (
    <div className="space-y-7">
      <PageHeader
        title={t("stock.title")}
        description={t("stock.subtitle")}
        actions={
          isAdmin ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("stock.adjust")}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("stock.history")}</CardTitle>
            <CardDescription>
              {meta?.total ?? 0} {t("common.items")}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={ingredientFilter}
              onChange={(event) => {
                setIngredientFilter(event.target.value)
                setPage(1)
              }}
              className="sm:w-52"
            >
              <option value="">{t("stock.filterIngredient")}</option>
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </option>
              ))}
            </Select>
            <Select
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value)
                setPage(1)
              }}
              className="sm:w-44"
            >
              <option value="">{t("stock.filterType")}</option>
              {["purchase", "sale", "waste", "adjustment", "reversal"].map(
                (type) => (
                  <option key={type} value={type}>
                    {t(`status.${type}`)}
                  </option>
                ),
              )}
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-2">
          {movementsQuery.isLoading ? (
            <div className="space-y-3 px-5 pb-5 sm:px-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title={t("stock.empty")}
              description={t("stock.emptyHint")}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3 font-semibold sm:px-6">
                      {t("common.date")}
                    </th>
                    <th className="px-3 py-3 font-semibold">{t("stock.ingredient")}</th>
                    <th className="px-3 py-3 font-semibold">{t("stock.type")}</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      {t("stock.quantity")}
                    </th>
                    <th className="px-3 py-3 font-semibold">{t("stock.notes")}</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">
                      {t("stock.reference")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b border-border/60 last:border-0 hover:bg-cream/40"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-muted sm:px-6">
                        {formatDateTime(movement.created_at, i18n.language)}
                      </td>
                      <td className="px-3 py-3.5 font-semibold text-espresso">
                        {movement.ingredient?.name ?? "-"}
                      </td>
                      <td className="px-3 py-3.5">
                        <MovementTypeBadge type={movement.type} />
                      </td>
                      <td className="px-3 py-3.5 text-right font-semibold">
                        {formatNumber(movement.quantity)}
                      </td>
                      <td className="max-w-xs truncate px-3 py-3.5 text-muted">
                        {movement.notes || "-"}
                      </td>
                      <td className="px-5 py-3.5 sm:px-6">
                        {movement.reference_id ? (
                          <Badge variant="outline">
                            #{movement.reference_id}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted">
                            {t("stock.manual")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <StockFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        ingredients={ingredients}
        saving={createMutation.isPending}
        onSubmit={(body) => createMutation.mutate(body)}
      />
    </div>
  )
}

interface StockFormModalProps {
  open: boolean
  onClose: () => void
  ingredients: Array<{
    id: number
    name: string
    stock: number | string
    unit?: { abbreviation: string }
  }>
  saving: boolean
  onSubmit: (body: StockMovementInput) => void
}

function StockFormModal({
  open,
  onClose,
  ingredients,
  saving,
  onSubmit,
}: StockFormModalProps) {
  const { t } = useTranslation()
  const [ingredientId, setIngredientId] = useState("")
  const [type, setType] = useState<(typeof movementTypes)[number]>("purchase")
  const [quantity, setQuantity] = useState("")
  const [targetStock, setTargetStock] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    const first = ingredients[0]
    setIngredientId(first ? String(first.id) : "")
    setType("purchase")
    setQuantity("")
    setTargetStock(first ? String(Number(first.stock)) : "0")
    setNotes("")
    setError("")
  }, [open, ingredients])

  const selected = ingredients.find(
    (ingredient) => String(ingredient.id) === ingredientId,
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!ingredientId) {
      setError(t("validation.required"))
      return
    }

    if (type === "adjustment") {
      const target = Number(targetStock)
      if (!Number.isFinite(target) || target < 0) {
        setError(t("validation.nonNegative"))
        return
      }
      onSubmit({
        ingredient_id: Number(ingredientId),
        type,
        target_stock: target,
        notes: notes.trim() || undefined,
      })
      return
    }

    const value = Number(quantity)
    if (!Number.isFinite(value) || value <= 0) {
      setError(t("validation.positive"))
      return
    }

    onSubmit({
      ingredient_id: Number(ingredientId),
      type,
      quantity: value,
      notes: notes.trim() || undefined,
    })
  }

  const hint =
    type === "purchase"
      ? t("stock.purchaseHint")
      : type === "waste"
        ? t("stock.wasteHint")
        : t("stock.adjustmentHint")

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("stock.formTitle")}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="stock-form" loading={saving}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="stock-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("stock.ingredient")} required>
          <Select
            value={ingredientId}
            onChange={(event) => {
              setIngredientId(event.target.value)
              const ingredient = ingredients.find(
                (item) => String(item.id) === event.target.value,
              )
              setTargetStock(ingredient ? String(Number(ingredient.stock)) : "0")
            }}
          >
            <option value="">{t("stock.selectIngredient")}</option>
            {ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </Select>
        </Field>

        {selected && (
          <div className="flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-sm">
            <span className="text-muted">{t("stock.currentStock")}</span>
            <span className="font-semibold text-espresso">
              {formatNumber(selected.stock)}{" "}
              {selected.unit?.abbreviation ?? ""}
            </span>
          </div>
        )}

        <Field label={t("stock.type")} hint={hint} required>
          <div className="grid grid-cols-3 gap-2">
            {movementTypes.map((movementType) => (
              <button
                key={movementType}
                type="button"
                onClick={() => {
                  setType(movementType)
                  setError("")
                  if (movementType === "adjustment" && selected) {
                    setTargetStock(String(Number(selected.stock)))
                  }
                }}
                className={
                  type === movementType
                    ? "rounded-xl border border-caramel bg-caramel/10 px-2 py-2.5 text-xs font-semibold text-caramel"
                    : "rounded-xl border border-border bg-surface px-2 py-2.5 text-xs font-semibold text-muted transition hover:border-espresso/20 hover:text-espresso"
                }
              >
                {t(`status.${movementType}`)}
              </button>
            ))}
          </div>
        </Field>

        {type === "adjustment" ? (
          <Field label={t("stock.targetStock")} hint={t("stock.adjustmentHint")} required>
            <Input
              type="number"
              min={0}
              value={targetStock}
              onChange={(event) => setTargetStock(event.target.value)}
            />
          </Field>
        ) : (
          <Field label={t("stock.quantity")} hint={hint} required>
            <Input
              type="number"
              min={0}
              step="0.001"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="0"
            />
          </Field>
        )}

        <Field label={t("stock.notes")}>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("stock.notesPlaceholder")}
          />
        </Field>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}
      </form>
    </Modal>
  )
}
