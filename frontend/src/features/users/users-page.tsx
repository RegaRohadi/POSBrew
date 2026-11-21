import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, UserX, Users } from "lucide-react"
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
import { SearchInput } from "@/components/ui/search-input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { formatDate } from "@/lib/format"
import { userApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { useAuthStore } from "@/stores/auth"
import type { Role, User, UserInput } from "@/types"

export function UsersPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)

  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)

  const usersQuery = useQuery({ queryKey: ["users"], queryFn: userApi.list })
  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: userApi.roles })

  const users = (usersQuery.data ?? []).filter((user) => {
    const query = search.toLowerCase()
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  })
  const roles = rolesQuery.data ?? []

  const saveMutation = useMutation({
    mutationFn: ({ id, body }: { id?: number; body: UserInput }) =>
      id ? userApi.update(id, body) : userApi.create(body),
    onSuccess: (_data, variables) => {
      toast.success(
        t(variables.id ? "messages.updated" : "messages.created", {
          entity: t("entities.user"),
        }),
      )
      void queryClient.invalidateQueries({ queryKey: ["users"] })
      setFormOpen(false)
      setEditing(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => userApi.deactivate(id),
    onSuccess: () => {
      toast.success(t("messages.deactivated", { entity: t("entities.user") }))
      void queryClient.invalidateQueries({ queryKey: ["users"] })
      setDeactivateTarget(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  return (
    <div className="space-y-7">
      <PageHeader
        title={t("users.title")}
        description={t("users.subtitle")}
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            {t("users.add")}
          </Button>
        }
      />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("nav.users")}</CardTitle>
            <CardDescription>
              {users.length} {t("common.items")}
            </CardDescription>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("users.searchPlaceholder")}
            className="sm:w-64"
          />
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-2">
          {usersQuery.isLoading ? (
            <div className="space-y-3 px-5 pb-5 sm:px-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("users.empty")}
              description={t("users.emptyHint")}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3 font-semibold sm:px-6">
                      {t("users.name")}
                    </th>
                    <th className="px-3 py-3 font-semibold">{t("users.role")}</th>
                    <th className="px-3 py-3 font-semibold">{t("common.status")}</th>
                    <th className="px-3 py-3 font-semibold">{t("common.date")}</th>
                    <th className="px-5 py-3 text-right font-semibold sm:px-6">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/60 last:border-0 hover:bg-cream/40"
                    >
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-espresso text-[0.7rem] font-bold text-cream">
                            {user.name
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join("")}
                          </div>
                          <div>
                            <p className="font-semibold text-espresso">
                              {user.name}
                              {user.id === currentUser?.id && (
                                <span className="ml-2 text-[0.7rem] font-medium text-muted">
                                  ({t("users.you")})
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge variant={user.role?.name === "admin" ? "accent" : "neutral"}>
                          {user.role?.name === "admin"
                            ? t("auth.admin")
                            : t("auth.cashier")}
                        </Badge>
                      </td>
                      <td className="px-3 py-3.5">
                        <Badge variant={user.is_active ? "success" : "neutral"}>
                          {user.is_active
                            ? t("common.active")
                            : t("common.inactive")}
                        </Badge>
                      </td>
                      <td className="px-3 py-3.5 text-muted">
                        {formatDate(user.created_at, i18n.language)}
                      </td>
                      <td className="px-5 py-3.5 text-right sm:px-6">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(user)
                              setFormOpen(true)
                            }}
                            aria-label={t("common.edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {user.id !== currentUser?.id && user.is_active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-danger hover:bg-danger/10 hover:text-danger"
                              onClick={() => setDeactivateTarget(user)}
                              aria-label={t("users.deactivate")}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
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

      <UserFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        user={editing}
        roles={roles}
        saving={saveMutation.isPending}
        onSubmit={(body) => saveMutation.mutate({ id: editing?.id, body })}
      />

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) deactivateMutation.mutate(deactivateTarget.id)
        }}
        title={t("users.deactivateTitle")}
        description={t("users.deactivateDesc")}
        confirmLabel={t("users.deactivate")}
        loading={deactivateMutation.isPending}
      />
    </div>
  )
}

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user: User | null
  roles: Role[]
  saving: boolean
  onSubmit: (body: UserInput) => void
}

function UserFormModal({
  open,
  onClose,
  user,
  roles,
  saving,
  onSubmit,
}: UserFormModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [roleId, setRoleId] = useState("")
  const [password, setPassword] = useState("")
  const [active, setActive] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setName(user?.name ?? "")
    setEmail(user?.email ?? "")
    setRoleId(user ? String(user.role_id) : roles[0] ? String(roles[0].id) : "")
    setPassword("")
    setActive(user?.is_active ?? true)
    setError("")
  }, [open, user, roles])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !roleId) {
      setError(t("validation.required"))
      return
    }

    if (!user && password.length < 6) {
      setError(t("validation.passwordMin"))
      return
    }

    if (password && password.length < 6) {
      setError(t("validation.passwordMin"))
      return
    }

    onSubmit({
      role_id: Number(roleId),
      name: name.trim(),
      email: email.trim(),
      password: password || undefined,
      is_active: active,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? t("users.formEdit") : t("users.formAdd")}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="user-form" loading={saving}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("users.name")} required>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("users.namePlaceholder")}
          />
        </Field>

        <Field label={t("users.email")} required>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("users.emailPlaceholder")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("users.role")} required>
            <Select
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
            >
              <option value="">{t("users.selectRole")}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name === "admin" ? t("auth.admin") : t("auth.cashier")}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t("users.password")}
            hint={user ? t("users.passwordHint") : t("validation.passwordMin")}
            required={!user}
          >
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••"
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-cream/50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-espresso">
              {t("users.active")}
            </p>
            <p className="text-xs text-muted">
              {t("common.active")} / {t("common.inactive")}
            </p>
          </div>
          <Switch
            checked={active}
            onChange={setActive}
            label={t("users.active")}
          />
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}
      </form>
    </Modal>
  )
}
