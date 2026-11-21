import { useQuery } from "@tanstack/react-query"
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  Coffee,
  ReceiptText,
  TriangleAlert,
  Wallet,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ProductThumb } from "@/components/shared/product-thumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { reportApi } from "@/lib/api"
import {
  addDaysISO,
  formatCurrency,
  formatNumber,
  formatShortDate,
  todayISO,
} from "@/lib/format"

export function ReportsPage() {
  const { t, i18n } = useTranslation()

  const [fromInput, setFromInput] = useState(addDaysISO(-6))
  const [toInput, setToInput] = useState(todayISO())
  const [from, setFrom] = useState(fromInput)
  const [to, setTo] = useState(toInput)

  const summaryQuery = useQuery({
    queryKey: ["reports", "summary"],
    queryFn: reportApi.summary,
  })
  const salesQuery = useQuery({
    queryKey: ["reports", "sales", from, to],
    queryFn: () => reportApi.sales({ from, to }),
  })
  const topProductsQuery = useQuery({
    queryKey: ["reports", "top-products", from, to],
    queryFn: () => reportApi.topProducts({ from, to, limit: 10 }),
  })

  const summary = summaryQuery.data
  const sales = salesQuery.data?.items ?? []
  const topProducts = topProductsQuery.data?.items ?? []
  const rangeRevenue = sales.reduce((total, item) => total + item.revenue, 0)
  const rangeTransactions = sales.reduce(
    (total, item) => total + item.transactions,
    0,
  )
  const average =
    rangeTransactions > 0 ? Math.round(rangeRevenue / rangeTransactions) : 0
  const maxSold = Math.max(...topProducts.map((item) => item.quantity_sold), 1)

  const applyPreset = (days: number | "today" | "month") => {
    if (days === "today") {
      const date = todayISO()
      setFromInput(date)
      setToInput(date)
      setFrom(date)
      setTo(date)
      return
    }

    if (days === "month") {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const offset = start.getTimezoneOffset()
      const iso = new Date(start.getTime() - offset * 60_000)
        .toISOString()
        .slice(0, 10)
      const end = todayISO()
      setFromInput(iso)
      setToInput(end)
      setFrom(iso)
      setTo(end)
      return
    }

    const start = addDaysISO(-(days - 1))
    const end = todayISO()
    setFromInput(start)
    setToInput(end)
    setFrom(start)
    setTo(end)
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title={t("reports.title")}
        description={t("reports.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => applyPreset(7)}>
              {t("reports.last7")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset(30)}>
              {t("reports.last30")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset("today")}>
              {t("reports.today")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => applyPreset("month")}>
              {t("reports.thisMonth")}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-caramel" />
            {t("reports.range")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label={t("reports.from")}>
            <Input
              type="date"
              value={fromInput}
              onChange={(event) => setFromInput(event.target.value)}
            />
          </Field>
          <Field label={t("reports.to")}>
            <Input
              type="date"
              value={toInput}
              onChange={(event) => setToInput(event.target.value)}
            />
          </Field>
          <Button
            onClick={() => {
              setFrom(fromInput)
              setTo(toInput)
            }}
          >
            {t("reports.apply")}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: t("reports.todayRevenue"),
            value: formatCurrency(summary?.today_revenue ?? 0),
            icon: Wallet,
            tone: "bg-caramel/10 text-caramel",
          },
          {
            label: t("reports.monthRevenue"),
            value: formatCurrency(summary?.month_revenue ?? 0),
            icon: ArrowUpRight,
            tone: "bg-success/10 text-success",
          },
          {
            label: t("reports.totalRevenue"),
            value: formatCurrency(summary?.total_revenue ?? 0),
            icon: BarChart3,
            tone: "bg-espresso/5 text-espresso",
          },
          {
            label: t("reports.lowStock"),
            value: summary?.low_stock_ingredients ?? 0,
            icon: TriangleAlert,
            tone: "bg-warning/10 text-warning",
          },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[0.7rem] font-semibold uppercase leading-relaxed tracking-[0.08em] text-muted">
                  {card.label}
                </p>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.65rem] ${card.tone}`}
                >
                  <card.icon className="h-4 w-4" strokeWidth={1.8} />
                </div>
              </div>
              {summaryQuery.isLoading ? (
                <Skeleton className="mt-4 h-8 w-28" />
              ) : (
                <p className="tabular mt-4 font-display text-[1.85rem] font-semibold tracking-[-0.02em]">
                  {card.value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: t("reports.totalRevenue"),
            value: formatCurrency(rangeRevenue),
            hint: `${from} - ${to}`,
            icon: ArrowUpRight,
          },
          {
            label: t("reports.totalTransactions"),
            value: formatNumber(rangeTransactions),
            hint: `${from} - ${to}`,
            icon: ReceiptText,
          },
          {
            label: t("reports.average"),
            value: formatCurrency(average),
            hint: t("reports.average"),
            icon: ArrowDownRight,
          },
        ].map((card) => (
          <Card key={card.label} className="bg-espresso text-cream">
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-cream/60">
                  {card.label}
                </p>
                <card.icon className="h-4 w-4 text-amber" />
              </div>
              <p className="tabular mt-3 font-display text-[1.8rem] font-semibold">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-cream/55">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.salesChart")}</CardTitle>
          <CardDescription>{t("reports.salesChartDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {salesQuery.isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : sales.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title={t("reports.empty")}
              description={t("reports.emptyHint")}
            />
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sales}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#EFE6DA" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value: string) =>
                      formatShortDate(value, i18n.language)
                    }
                    tick={{ fill: "#6E5E52", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    tickFormatter={(value: number) =>
                      new Intl.NumberFormat("id-ID", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(value)
                    }
                    tick={{ fill: "#6E5E52", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={58}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      t("reports.revenue"),
                    ]}
                    labelFormatter={(label) =>
                      formatShortDate(String(label), i18n.language)
                    }
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid #E7DCD0",
                      boxShadow: "0 24px 50px -28px rgba(34,25,19,0.35)",
                      fontSize: 12,
                      background: "#FFFDFB",
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#9C4A2F"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.topProducts")}</CardTitle>
          <CardDescription>{t("reports.topProductsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {topProductsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <EmptyState
              icon={Coffee}
              title={t("reports.noTopProducts")}
              description={t("reports.emptyHint")}
            />
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream text-[0.7rem] font-bold text-caramel">
                    {index + 1}
                  </div>
                  <ProductThumb
                    name={product.product_name}
                    className="h-10 w-10 rounded-[0.7rem]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-espresso">
                        {product.product_name}
                      </p>
                      <p className="tabular shrink-0 text-xs font-semibold text-espresso">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-dark">
                        <div
                          className="h-full rounded-full bg-caramel"
                          style={{
                            width: `${(product.quantity_sold / maxSold) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="shrink-0 text-[0.7rem] text-muted">
                        {product.quantity_sold} {t("reports.quantitySold")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
