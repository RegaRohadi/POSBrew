import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Eye, Printer, ReceiptText, Ban } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Receipt } from "@/components/shared/receipt"
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
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TransactionStatusBadge } from "@/components/ui/status-badge"
import { transactionApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { useAuthStore } from "@/stores/auth"
import type { Transaction } from "@/types"

const statuses = ["", "paid", "pending", "cancelled"] as const

export function TransactionsPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((state) => state.user?.role?.name === "admin")

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [detailId, setDetailId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Transaction | null>(null)

  const transactionsQuery = useQuery({
    queryKey: ["transactions", page, status, from, to],
    queryFn: () =>
      transactionApi.list({
        page,
        limit: 10,
        status: status || undefined,
        date_from: from || undefined,
        date_to: to || undefined,
      }),
  })

  const detailQuery = useQuery({
    queryKey: ["transaction", detailId],
    queryFn: () => transactionApi.get(detailId as number),
    enabled: detailId !== null,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => transactionApi.cancel(id),
    onSuccess: () => {
      toast.success(t("transactions.cancelledSuccess"))
      void queryClient.invalidateQueries({ queryKey: ["transactions"] })
      void queryClient.invalidateQueries({ queryKey: ["transaction", detailId] })
      void queryClient.invalidateQueries({ queryKey: ["ingredients"] })
      void queryClient.invalidateQueries({ queryKey: ["reports"] })
      setCancelTarget(null)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  const transactions = transactionsQuery.data?.items ?? []
  const meta = transactionsQuery.data?.pagination
  const detail = detailQuery.data

  return (
    <div className="space-y-7">
      <PageHeader
        title={t("transactions.title")}
        description={t("transactions.subtitle")}
      />

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{t("transactions.title")}</CardTitle>
              <CardDescription>
                {meta?.total ?? 0} {t("common.items")}
              </CardDescription>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label={t("common.status")}>
              <Select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">{t("transactions.allStatuses")}</option>
                {statuses
                  .filter(Boolean)
                  .map((value) => (
                    <option key={value} value={value}>
                      {t(`status.${value}`)}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label={t("transactions.from")}>
              <Input
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value)
                  setPage(1)
                }}
              />
            </Field>
            <Field label={t("transactions.to")}>
              <Input
                type="date"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value)
                  setPage(1)
                }}
              />
            </Field>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0 pt-2">
          {transactionsQuery.isLoading ? (
            <div className="space-y-3 px-5 pb-5 sm:px-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title={t("transactions.empty")}
              description={t("transactions.emptyHint")}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3 font-semibold sm:px-6">
                      {t("transactions.invoice")}
                    </th>
                    <th className="px-3 py-3 font-semibold">{t("common.date")}</th>
                    <th className="px-3 py-3 font-semibold">
                      {t("transactions.cashier")}
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      {t("common.total")}
                    </th>
                    <th className="px-3 py-3 font-semibold">{t("common.status")}</th>
                    <th className="px-5 py-3 text-right font-semibold sm:px-6">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-border/60 last:border-0 hover:bg-cream/40"
                    >
                      <td className="px-5 py-3.5 font-semibold text-espresso sm:px-6">
                        {transaction.invoice_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-xs text-muted">
                        {formatDateTime(transaction.created_at, i18n.language)}
                      </td>
                      <td className="px-3 py-3.5 text-muted">
                        {transaction.user_name ?? "-"}
                      </td>
                      <td className="px-3 py-3.5 text-right font-semibold">
                        {formatCurrency(transaction.total)}
                      </td>
                      <td className="px-3 py-3.5">
                        <TransactionStatusBadge status={transaction.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right sm:px-6">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDetailId(transaction.id)}
                            aria-label={t("common.view")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isAdmin && transaction.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-danger hover:bg-danger/10 hover:text-danger"
                              onClick={() => setCancelTarget(transaction)}
                              aria-label={t("transactions.cancelAction")}
                            >
                              <Ban className="h-4 w-4" />
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
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <Modal
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        title={t("transactions.detailTitle")}
        description={detail?.invoice_number}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              {t("transactions.printReceipt")}
            </Button>
            <Button onClick={() => setDetailId(null)}>{t("common.close")}</Button>
          </>
        }
      >
        {detailQuery.isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : detail ? (
          <div className="rounded-2xl border border-border bg-cream/40 p-3">
            <Receipt transaction={detail} />
          </div>
        ) : (
          <p className="text-sm text-muted">{t("errors.notFound")}</p>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) cancelMutation.mutate(cancelTarget.id)
        }}
        title={t("transactions.cancelTitle")}
        description={t("transactions.cancelDesc")}
        confirmLabel={t("transactions.cancelAction")}
        loading={cancelMutation.isPending}
      />
    </div>
  )
}
