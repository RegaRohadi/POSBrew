import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Boxes, Pencil, Plus, Trash2 } from "lucide-react"
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
import { Pagination } from "@/components/ui/pagination"
import { SearchInput } from "@/components/ui/search-input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { StockLevelBadge } from "@/components/ui/status-badge"
import { apiErrorMessage } from "@/lib/errors"
import { formatNumber } from "@/lib/format"
import { useDebouncedValue } from "@/lib/hooks"
import { ingredientApi, unitApi } from "@/lib/api"
import { useAuthStore } from "@/stores/auth"
import type { Ingredient, IngredientInput, Unit } from "@/types"

export function IngredientsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((state) => state.user?.role?.name === "admin")

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const [lowStock, setLowStock] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)

  const unitsQuery = useQuery({ queryKey: ["units"], queryFn: unitApi.list })
  const ingredientsQuery = useQuery({
    queryKey: ["ingredients", page, debouncedSearch, lowStock],
    queryFn: () =>
      ingredientApi.list({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        low_stock: lowStock || undefined,
      }),
  })

  const ingredients = ingredientsQuery.data?.items ?? []
  const meta = ingredientsQuery.data?.pagination
  const units = unitsQuery.data ?? []

  const saveMutation = useMutation({
    mutationFn: ({ id, body }: { id?: number; body: IngredientInput }) =>
      id ? ingredientApi.update(id, body) : ingredientApi.create(body),
    onSuccess: (_data, variables) => {
      toast.success(
        t(variables.id ? "messages.updated" : "messages.created", {
          entity: t("entities.ingredient"),
        }),
      )
      void queryClient.invalidateQueries({ queryKey: ["ingredients"] })
      void queryClient.invalidateQueries({ queryKey: ["reports"] })
      setFormOpen(false)
      setEditing(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ingredientApi.remove(id),
    onSuccess: () => {
      toast.success(t("messages.deleted", { entity: t("entities.ingredient") }))
      void queryClient.invalidateQueries({ queryKey: ["ingredients"] })
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  return (
    <div className="space-y-7">
      <PageHeader
        title={t("ingredients.title")}
        description={t("ingredients.subtitle")}
        actions={
          isAdmin ? (
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              {t("ingredients.add")}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("nav.ingredients")}</CardTitle>
            <CardDescription>
              {meta?.total ?? 0} {t("common.items")}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
              <Switch checked={lowStock} onChange={(value) => {
                setLowStock(value)
                setPage(1)
              }} label={t("ingredients.lowStockOnly")} />
              <span className="text-xs font-semibold text-muted">
                {t("ingredients.lowStockOnly")}
              </span>
            </div>
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
              placeholder={t("ingredients.searchPlaceholder")}
              className="sm:w-60"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-2">
          {ingredientsQuery.isLoading ? (
            <div className="space-y-3 px-5 pb-5 sm:px-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : ingredients.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title={t("ingredients.empty")}
              description={t("ingredients.emptyHint")}
              action={
                isAdmin ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(null)
                      setFormOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {t("ingredients.add")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3 font-semibold sm:px-6">
                      {t("ingredients.name")}
                    </th>
                    <th className="px-3 py-3 font-semibold">{t("common.unit")}</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      {t("ingredients.stock")}
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      {t("ingredients.minimumStock")}
                    </th>
                    <th className="px-3 py-3 font-semibold">{t("common.status")}</th>
                    <th className="px-3 py-3 font-semibold">{t("common.active")}</th>
                    {isAdmin && (
                      <th className="px-5 py-3 text-right font-semibold sm:px-6">
                        {t("common.actions")}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient) => {
                    const low =
                      Number(ingredient.stock) <= Number(ingredient.minimum_stock)
                    return (
                      <tr
                        key={ingredient.id}
                        className="border-b border-border/60 last:border-0 hover:bg-cream/40"
                      >
                        <td className="px-5 py-3.5 font-semibold text-espresso sm:px-6">
                          {ingredient.name}
                        </td>
                        <td className="px-3 py-3.5 text-muted">
                          {ingredient.unit?.abbreviation ?? "-"}
                        </td>
                        <td className="px-3 py-3.5 text-right font-semibold">
                          {formatNumber(ingredient.stock)}
                        </td>
                        <td className="px-3 py-3.5 text-right text-muted">
                          {formatNumber(ingredient.minimum_stock)}
                        </td>
                        <td className="px-3 py-3.5">
                          <StockLevelBadge low={low} />
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge
                            variant={ingredient.is_active ? "success" : "neutral"}
                          >
                            {ingredient.is_active
                              ? t("common.active")
                              : t("common.inactive")}
                          </Badge>
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3.5 text-right sm:px-6">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditing(ingredient)
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
                                onClick={() => setDeleteTarget(ingredient)}
                                aria-label={t("common.delete")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <IngredientFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        ingredient={editing}
        units={units}
        saving={saveMutation.isPending}
        onSubmit={(body) => saveMutation.mutate({ id: editing?.id, body })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        title={t("ingredients.deleteTitle")}
        description={t("ingredients.deleteDesc")}
        confirmLabel={t("common.delete")}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

interface IngredientFormModalProps {
  open: boolean
  onClose: () => void
  ingredient: Ingredient | null
  units: Unit[]
  saving: boolean
  onSubmit: (body: IngredientInput) => void
}

function IngredientFormModal({
  open,
  onClose,
  ingredient,
  units,
  saving,
  onSubmit,
}: IngredientFormModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [unitId, setUnitId] = useState("")
  const [minimumStock, setMinimumStock] = useState("")
  const [active, setActive] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setName(ingredient?.name ?? "")
    setUnitId(ingredient ? String(ingredient.unit_id) : "")
    setMinimumStock(
      ingredient ? String(Number(ingredient.minimum_stock)) : "",
    )
    setActive(ingredient?.is_active ?? true)
    setError("")
  }, [open, ingredient])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !unitId) {
      setError(t("validation.required"))
      return
    }

    const minimum = Number(minimumStock)
    if (!Number.isFinite(minimum) || minimum < 0) {
      setError(t("validation.nonNegative"))
      return
    }

    onSubmit({
      unit_id: Number(unitId),
      name: name.trim(),
      minimum_stock: minimum,
      is_active: active,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ingredient ? t("ingredients.formEdit") : t("ingredients.formAdd")}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="ingredient-form" loading={saving}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="ingredient-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("ingredients.name")} required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("ingredients.namePlaceholder")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("ingredients.unit")} required>
            <Select
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
            >
              <option value="">{t("ingredients.selectIngredient")}</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.abbreviation})
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t("ingredients.minimumStock")}
            hint={
              ingredient
                ? `${t("ingredients.stock")}: ${formatNumber(ingredient.stock)} ${ingredient.unit?.abbreviation ?? ""}`
                : undefined
            }
          >
            <Input
              type="number"
              min={0}
              value={minimumStock}
              onChange={(event) => setMinimumStock(event.target.value)}
              placeholder="100"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-cream/50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-espresso">
              {t("ingredients.active")}
            </p>
            <p className="text-xs text-muted">
              {t("common.active")} / {t("common.inactive")}
            </p>
          </div>
          <Switch
            checked={active}
            onChange={setActive}
            label={t("ingredients.active")}
          />
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}
      </form>
    </Modal>
  )
}
