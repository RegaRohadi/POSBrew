import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import type { StockMovementType, TransactionStatus } from "@/types"

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const { t } = useTranslation()

  const variant =
    status === "paid" ? "success" : status === "cancelled" ? "danger" : "warning"

  return <Badge variant={variant}>{t(`status.${status}`)}</Badge>
}

export function MovementTypeBadge({ type }: { type: StockMovementType }) {
  const { t } = useTranslation()

  const variant =
    type === "purchase"
      ? "success"
      : type === "sale"
        ? "accent"
        : type === "waste"
          ? "danger"
          : type === "adjustment"
            ? "warning"
            : "neutral"

  return <Badge variant={variant}>{t(`status.${type}`)}</Badge>
}

export function StockLevelBadge({ low }: { low: boolean }) {
  const { t } = useTranslation()

  return (
    <Badge variant={low ? "danger" : "success"}>
      {low ? t("status.low") : t("status.normal")}
    </Badge>
  )
}
