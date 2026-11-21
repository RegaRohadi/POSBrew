import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Tags, Trash2 } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

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
import { SearchInput } from "@/components/ui/search-input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { categoryApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatDate } from "@/lib/format"
import type { Category, CategoryInput } from "@/types"

export function CategoriesPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.list,
  })

  const categories = (categoriesQuery.data ?? []).filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase()),
  )

  const saveMutation = useMutation({
    mutationFn: ({ id, body }: { id?: number; body: CategoryInput }) =>
      id ? categoryApi.update(id, body) : categoryApi.create(body),
    onSuccess: (_data, variables) => {
      toast.success(
        t(variables.id ? "messages.updated" : "messages.created", {
          entity: t("entities.category"),
        }),
      )
      void queryClient.invalidateQueries({ queryKey: ["categories"] })
      void queryClient.invalidateQueries({ queryKey: ["products"] })
      setFormOpen(false)
      setEditing(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryApi.remove(id),
    onSuccess: () => {
      toast.success(t("messages.deleted", { entity: t("entities.category") }))
      void queryClient.invalidateQueries({ queryKey: ["categories"] })
      void queryClient.invalidateQueries({ queryKey: ["products"] })
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  return (
    <div className="space-y-7">
      <PageHeader
        title={t("categories.title")}
        description={t("categories.subtitle")}
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            {t("categories.add")}
          </Button>
        }
      />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("nav.categories")}</CardTitle>
            <CardDescription>
              {categories.length} {t("common.items")}
            </CardDescription>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("common.search")}
            className="sm:w-64"
          />
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-2">
          {categoriesQuery.isLoading ? (
            <div className="space-y-3 px-5 pb-5 sm:px-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title={t("categories.empty")}
              description={t("categories.emptyHint")}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null)
                    setFormOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {t("categories.add")}
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3 font-semibold sm:px-6">
                      {t("categories.name")}
                    </th>
                    <th className="px-3 py-3 font-semibold">
                      {t("categories.description")}
                    </th>
                    <th className="px-3 py-3 font-semibold">{t("common.date")}</th>
                    <th className="px-5 py-3 text-right font-semibold sm:px-6">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="border-b border-border/60 last:border-0 hover:bg-cream/40"
                    >
                      <td className="px-5 py-3.5 font-semibold text-espresso sm:px-6">
                        {category.name}
                      </td>
                      <td className="max-w-sm truncate px-3 py-3.5 text-muted">
                        {category.description || t("common.none")}
                      </td>
                      <td className="px-3 py-3.5 text-muted">
                        {formatDate(category.created_at, i18n.language)}
                      </td>
                      <td className="px-5 py-3.5 text-right sm:px-6">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(category)
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
                            onClick={() => setDeleteTarget(category)}
                            aria-label={t("common.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        category={editing}
        saving={saveMutation.isPending}
        onSubmit={(body) => saveMutation.mutate({ id: editing?.id, body })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        title={t("categories.deleteTitle")}
        description={t("categories.deleteDesc")}
        confirmLabel={t("common.delete")}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  category: Category | null
  saving: boolean
  onSubmit: (body: CategoryInput) => void
}

function CategoryFormModal({
  open,
  onClose,
  category,
  saving,
  onSubmit,
}: CategoryFormModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setName(category?.name ?? "")
    setDescription(category?.description ?? "")
    setError("")
  }, [open, category])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError(t("validation.required"))
      return
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? t("categories.formEdit") : t("categories.formAdd")}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="category-form" loading={saving}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("categories.name")} required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("categories.namePlaceholder")}
          />
        </Field>
        <Field label={t("categories.description")}>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("categories.descriptionPlaceholder")}
          />
        </Field>
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
      </form>
    </Modal>
  )
}
