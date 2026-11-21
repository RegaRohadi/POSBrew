import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Coffee, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ProductThumb } from "@/components/shared/product-thumb"
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
import { Textarea } from "@/components/ui/textarea"
import { apiErrorMessage } from "@/lib/errors"
import { formatCurrency } from "@/lib/format"
import { useDebouncedValue } from "@/lib/hooks"
import { productApi, categoryApi } from "@/lib/api"
import { useAuthStore } from "@/stores/auth"
import type { Category, Product, ProductInput } from "@/types"

export function ProductsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((state) => state.user?.role?.name === "admin")

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.list,
  })

  const productsQuery = useQuery({
    queryKey: [
      "products",
      page,
      debouncedSearch,
      categoryFilter,
      availabilityFilter,
    ],
    queryFn: () =>
      productApi.list({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        category_id: categoryFilter || undefined,
        is_available: availabilityFilter || undefined,
      }),
  })

  const products = productsQuery.data?.items ?? []
  const meta = productsQuery.data?.pagination
  const categories = categoriesQuery.data ?? []

  const saveMutation = useMutation({
    mutationFn: ({ id, body }: { id?: number; body: ProductInput }) =>
      id ? productApi.update(id, body) : productApi.create(body),
    onSuccess: (_data, variables) => {
      toast.success(
        t(variables.id ? "messages.updated" : "messages.created", {
          entity: t("entities.product"),
        }),
      )
      void queryClient.invalidateQueries({ queryKey: ["products"] })
      void queryClient.invalidateQueries({ queryKey: ["reports"] })
      setFormOpen(false)
      setEditing(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.remove(id),
    onSuccess: () => {
      toast.success(
        t("messages.deleted", { entity: t("entities.product") }),
      )
      void queryClient.invalidateQueries({ queryKey: ["products"] })
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  const availabilityMutation = useMutation({
    mutationFn: (product: Product) =>
      productApi.update(product.id, {
        category_id: product.category_id,
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        is_available: !product.is_available,
      }),
    onSuccess: () => {
      toast.success(t("messages.saved"))
      void queryClient.invalidateQueries({ queryKey: ["products"] })
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setFormOpen(true)
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title={t("products.title")}
        description={t("products.subtitle")}
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("products.add")}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("nav.products")}</CardTitle>
            <CardDescription>
              {meta?.total ?? 0} {t("common.items")}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
              placeholder={t("products.searchPlaceholder")}
              className="sm:w-56"
            />
            <Select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value)
                setPage(1)
              }}
              className="sm:w-56"
            >
              <option value="">{t("products.filterCategory")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select
              value={availabilityFilter}
              onChange={(event) => {
                setAvailabilityFilter(event.target.value)
                setPage(1)
              }}
              className="sm:w-56"
            >
              <option value="">{t("products.filterAvailability")}</option>
              <option value="true">{t("common.available")}</option>
              <option value="false">{t("common.unavailable")}</option>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0 pt-2">
          {productsQuery.isLoading ? (
            <div className="space-y-3 px-5 pb-5 sm:px-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Coffee}
              title={t("products.empty")}
              description={t("products.emptyHint")}
              action={
                isAdmin ? (
                  <Button variant="outline" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    {t("products.add")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3 font-semibold sm:px-6">
                      {t("products.name")}
                    </th>
                    <th className="px-3 py-3 font-semibold">{t("common.category")}</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      {t("common.price")}
                    </th>
                    <th className="px-3 py-3 font-semibold">{t("common.status")}</th>
                    {isAdmin && (
                      <th className="px-5 py-3 text-right font-semibold sm:px-6">
                        {t("common.actions")}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-cream/40"
                    >
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3.5">
                          <ProductThumb
                            name={product.name}
                            imageUrl={product.image_url}
                            className="h-12 w-12 rounded-[0.75rem]"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[0.92rem] font-semibold text-espresso">
                              {product.name}
                            </p>
                            <p className="mt-0.5 max-w-xs truncate text-xs text-muted">
                              {product.description || t("common.none")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-muted">
                        {product.category?.name ?? t("products.noCategory")}
                      </td>
                      <td className="tabular px-3 py-4 text-right font-semibold text-espresso">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={product.is_available ? "success" : "neutral"}
                          >
                            {product.is_available
                              ? t("common.available")
                              : t("common.unavailable")}
                          </Badge>
                          {isAdmin && (
                            <Switch
                              checked={product.is_available}
                              onChange={() => availabilityMutation.mutate(product)}
                              disabled={availabilityMutation.isPending}
                              label={t("products.available")}
                            />
                          )}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-4 text-right sm:px-6">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(product)}
                              aria-label={t("common.edit")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-danger hover:bg-danger/10 hover:text-danger"
                              onClick={() => setDeleteTarget(product)}
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
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <ProductFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        product={editing}
        categories={categories}
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
        title={t("products.deleteTitle")}
        description={t("products.deleteDesc")}
        confirmLabel={t("common.delete")}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  product: Product | null
  categories: Category[]
  saving: boolean
  onSubmit: (body: ProductInput) => void
}

function ProductFormModal({
  open,
  onClose,
  product,
  categories,
  saving,
  onSubmit,
}: ProductFormModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [available, setAvailable] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setName(product?.name ?? "")
    setCategoryId(product?.category_id ? String(product.category_id) : "")
    setPrice(product ? String(product.price) : "")
    setDescription(product?.description ?? "")
    setImageUrl(product?.image_url ?? "")
    setAvailable(product?.is_available ?? true)
    setError("")
  }, [open, product])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!name.trim()) {
      setError(t("validation.required"))
      return
    }

    const numericPrice = Number(price)
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError(t("validation.nonNegative"))
      return
    }

    onSubmit({
      category_id: categoryId ? Number(categoryId) : null,
      name: name.trim(),
      description: description.trim() || null,
      price: Math.round(numericPrice),
      image_url: imageUrl.trim() || null,
      is_available: available,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? t("products.formEdit") : t("products.formAdd")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="product-form" loading={saving}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("products.name")} required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("products.namePlaceholder")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("products.category")}>
            <Select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">{t("products.noCategory")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("products.price")} hint={t("products.priceHint")} required>
            <Input
              type="number"
              min={0}
              step={500}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="28000"
            />
          </Field>
        </div>

        <Field label={t("products.description")}>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("products.descriptionPlaceholder")}
          />
        </Field>

        <Field label={t("products.imageUrl")} hint={t("products.imageHint")}>
          <div className="flex items-center gap-3">
            <ProductThumb
              name={name || "POSBrew"}
              imageUrl={imageUrl}
              className="h-14 w-14 rounded-[0.85rem]"
            />
            <Input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://..."
              className="flex-1"
              aria-label={t("products.imageUrl")}
            />
          </div>
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-border bg-cream/50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-espresso">
              {t("products.available")}
            </p>
            <p className="text-xs text-muted">
              {t("common.available")} / {t("common.unavailable")}
            </p>
          </div>
          <Switch
            checked={available}
            onChange={setAvailable}
            label={t("products.available")}
          />
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}
      </form>
    </Modal>
  )
}
