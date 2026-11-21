import { useTranslation } from "react-i18next"

import { LogoMark } from "@/components/layout/logo"
import { formatCurrency, formatDateTime } from "@/lib/format"
import type { Transaction } from "@/types"

export function Receipt({ transaction }: { transaction: Transaction }) {
  const { t, i18n } = useTranslation()

  const items = transaction.items ?? []
  const payment = transaction.payment

  return (
    <div className="print-area mx-auto w-full max-w-sm bg-white px-5 py-6 font-mono text-[0.72rem] leading-relaxed text-espresso">
      <div className="flex flex-col items-center text-center">
        <LogoMark className="h-10 w-10" />
        <p className="mt-2 font-brand text-base font-semibold tracking-tight">
          POSBrew
        </p>
        <p className="text-[0.65rem] text-muted">{t("receipt.address")}</p>
        <p className="text-[0.65rem] text-muted">{t("receipt.phone")}</p>
      </div>

      <div className="my-4 border-t border-dashed border-espresso/20" />

      <div className="space-y-1">
        <div className="flex justify-between gap-3">
          <span className="text-muted">{t("receipt.invoice")}</span>
          <span className="font-semibold">{transaction.invoice_number}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">{t("receipt.date")}</span>
          <span>{formatDateTime(transaction.created_at, i18n.language)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">{t("receipt.cashier")}</span>
          <span>{transaction.user_name ?? "-"}</span>
        </div>
      </div>

      <div className="my-4 border-t border-dashed border-espresso/20" />

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between gap-3">
              <span className="font-semibold">{item.product_name}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
            <p className="text-[0.65rem] text-muted">
              {item.quantity} × {formatCurrency(item.price)}
            </p>
          </div>
        ))}
        {items.length === 0 && <p className="text-muted">{t("transactions.noItems")}</p>}
      </div>

      <div className="my-4 border-t border-dashed border-espresso/20" />

      <div className="space-y-1">
        <div className="flex justify-between gap-3">
          <span className="text-muted">{t("receipt.subtotal")}</span>
          <span>{formatCurrency(transaction.subtotal)}</span>
        </div>
        {transaction.discount > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-muted">{t("receipt.discount")}</span>
            <span>-{formatCurrency(transaction.discount)}</span>
          </div>
        )}
        <div className="flex justify-between gap-3 pt-1 text-sm font-bold">
          <span>{t("receipt.total")}</span>
          <span>{formatCurrency(transaction.total)}</span>
        </div>
      </div>

      {payment && (
        <>
          <div className="my-4 border-t border-dashed border-espresso/20" />
          <div className="space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-muted">{t("receipt.payment")}</span>
              <span className="uppercase">{payment.method}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted">{t("transactions.amount")}</span>
              <span>{formatCurrency(payment.amount)}</span>
            </div>
            {payment.method === "cash" && (
              <div className="flex justify-between gap-3">
                <span className="text-muted">{t("receipt.change")}</span>
                <span>{formatCurrency(transaction.change)}</span>
              </div>
            )}
          </div>
        </>
      )}

      <div className="my-4 border-t border-dashed border-espresso/20" />

      <div className="text-center">
        {transaction.status === "cancelled" ? (
          <p className="inline-block rounded border border-danger/40 px-2 py-0.5 text-[0.65rem] font-bold text-danger">
            {t("receipt.cancelled")}
          </p>
        ) : (
          <p className="inline-block rounded border border-success/40 px-2 py-0.5 text-[0.65rem] font-bold text-success">
            {t("receipt.paid")}
          </p>
        )}
        <p className="mt-3 font-semibold">{t("receipt.thankYou")}</p>
        <p className="mt-1 text-[0.6rem] text-muted">{t("receipt.poweredBy")}</p>
      </div>
    </div>
  )
}
