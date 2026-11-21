import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Ruler, Trash2 } from "lucide-react"
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
import { apiErrorMessage } from "@/lib/errors"
import { unitApi } from "@/lib/api"
import type { Unit, UnitInput } from "@/types"

export function UnitsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Unit | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null)

  const unitsQuery = useQuery({ queryKey: ["units"], queryFn: unitApi.list })
  const units = (unitsQuery.data ?? []).filter((unit) => {
    const query = search.toLowerCase()
    return (
      unit.name.toLowerCase().includes(query) ||
      unit.abbreviation.toLowerCase().includes(query)
    )
  })

  const saveMutation = useMutation({
    mutationFn: ({ id, body }: { id?: number; body: UnitInput }) =>
      id ? unitApi.update(id, body) : unitApi.create(body),
    onSuccess: (_data, variables) => {
      toast.success(
        t(variables.id ? "messages.updated" : "messages.created", {
          entity: t("entities.unit"),
        }),
      )
      void queryClient.invalidateQueries({ queryKey: ["units"] })
      void queryClient.invalidateQueries({ queryKey: ["ingredients"] })
      setFormOpen(false)
      setEditing(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => unitApi.remove(id),
    onSuccess: () => {
      toast.success(t("messages.deleted", { entity: t("entities.unit") }))
      void queryClient.invalidateQueries({ queryKey: ["units"] })
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  return (
    <div className="space-y-7">
      <PageHeader
        title={t("units.title")}
        description={t("units.subtitle")}
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            {t("units.add")}
          </Button>
        }
      />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("nav.units")}</CardTitle>
            <CardDescription>
              {units.length} {t("common.items")}
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
          {unitsQuery.isLoading ? (
            <div className="space-y-3 px-5 pb-5 sm:px-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : units.length === 0 ? (
            <EmptyState
              icon={Ruler}
              title={t("units.empty")}
              description={t("units.emptyHint")}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null)
                    setFormOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {t("units.add")}
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3 font-semibold sm:px-6">
                      {t("units.name")}
                    </th>
                    <th className="px-3 py-3 font-semibold">
                      {t("units.abbreviation")}
                    </th>
                    <th className="px-5 py-3 text-right font-semibold sm:px-6">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => (
                    <tr
                      key={unit.id}
                      className="border-b border-border/60 last:border-0 hover:bg-cream/40"
                    >
                      <td className="px-5 py-3.5 font-semibold text-espresso sm:px-6">
                        {unit.name}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="rounded-md bg-cream px-2 py-1 font-mono text-xs font-semibold text-caramel">
                          {unit.abbreviation}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right sm:px-6">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(unit)
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
                            onClick={() => setDeleteTarget(unit)}
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

      <UnitFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        unit={editing}
        saving={saveMutation.isPending}
        onSubmit={(body) => saveMutation.mutate({ id: editing?.id, body })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        title={t("units.deleteTitle")}
        description={t("units.deleteDesc")}
        confirmLabel={t("common.delete")}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

interface UnitFormModalProps {
  open: boolean
  onClose: () => void
  unit: Unit | null
  saving: boolean
  onSubmit: (body: UnitInput) => void
}

function UnitFormModal({ open, onClose, unit, saving, onSubmit }: UnitFormModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [abbreviation, setAbbreviation] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setName(unit?.name ?? "")
    setAbbreviation(unit?.abbreviation ?? "")
    setError("")
  }, [open, unit])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !abbreviation.trim()) {
      setError(t("validation.required"))
      return
    }
    onSubmit({ name: name.trim(), abbreviation: abbreviation.trim() })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={unit ? t("units.formEdit") : t("units.formAdd")}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="unit-form" loading={saving}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="unit-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("units.name")} required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("units.namePlaceholder")}
          />
        </Field>
        <Field label={t("units.abbreviation")} required>
          <Input
            value={abbreviation}
            onChange={(event) => setAbbreviation(event.target.value)}
            placeholder={t("units.abbreviationPlaceholder")}
          />
        </Field>
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
      </form>
    </Modal>
  )
}
