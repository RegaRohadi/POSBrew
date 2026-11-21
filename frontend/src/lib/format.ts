export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatCurrency(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(toNumber(value))
}

export function formatNumber(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(
    toNumber(value),
  )
}

export function formatDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return "-"
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return "-"
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

export function formatShortDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value))
}

export function todayISO(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function addDaysISO(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}
