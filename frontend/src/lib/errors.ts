import axios from "axios"
import type { TFunction } from "i18next"

const exactMessages: Record<string, string> = {
  "invalid email or password": "errors.invalidCredentials",
  "user account is inactive": "errors.inactiveUser",
  "email already exists": "errors.emailExists",
  "transaction is already cancelled": "errors.alreadyCancelled",
  "transaction items cannot be empty": "errors.emptyCart",
  "discount cannot exceed subtotal": "errors.discountTooLarge",
  "payment amount is less than total": "errors.insufficientPayment",
  "category name already exists": "errors.duplicate",
  "ingredient name already exists": "errors.duplicate",
  "unit name or abbreviation already exists": "errors.duplicate",
  "recipe for this product and ingredient already exists": "errors.duplicate",
  "product is used by recipes or transactions": "errors.inUse",
  "category is used by products": "errors.inUse",
  "ingredient is used by recipes or stock movements": "errors.inUse",
  "unit is used by ingredients": "errors.inUse",
}

const statusMessages: Record<number, string> = {
  400: "errors.badRequest",
  401: "errors.sessionExpired",
  403: "errors.forbidden",
  404: "errors.notFound",
  409: "errors.conflict",
  422: "errors.unprocessable",
  500: "errors.server",
}

export function apiErrorMessage(error: unknown, t: TFunction): string {
  if (!axios.isAxiosError(error)) {
    return t("errors.generic")
  }

  if (!error.response) {
    return t("errors.network")
  }

  const status = error.response.status
  const raw = (error.response.data as { message?: string } | undefined)?.message ?? ""

  const normalized = raw.trim().toLowerCase()

  if (exactMessages[normalized]) {
    return t(exactMessages[normalized])
  }

  if (normalized.startsWith("insufficient ingredient stock")) {
    const detail = raw.split(": ").slice(1).join(": ")
    return detail
      ? t("errors.insufficientStockDetail", { detail })
      : t("errors.insufficientStock")
  }

  if (normalized.startsWith("product is not available")) {
    return t("errors.productUnavailable")
  }

  if (statusMessages[status]) {
    return t(statusMessages[status])
  }

  return t("errors.generic")
}
