import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  ArrowUpRight,
  Coffee,
  Plus,
  ShoppingBag,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

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
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { TransactionStatusBadge } from "@/components/ui/status-badge"
import { addDaysISO, formatCurrency, formatShortDate, todayISO } from "@/lib/format"
import { reportApi, transactionApi } from "@/lib/api"
import { cn } from "@/lib/utils"

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const from = addDaysISO(-13)
  const to = todayISO()

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
    queryFn: () => reportApi.topProducts({ from, to, limit: 5 }),
  })
  const lowStockQuery = useQuery({
    queryKey: ["reports", "low-stock"],
    queryFn: reportApi.lowStock,
  })
  const recentQuery = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: () => transactionApi.list({ page: 1, limit: 5 }),
  })

  const summary = summaryQuery.data
  const sales = salesQuery.data?.items ?? []
  const topProducts = topProductsQuery.data?.items ?? []
  const lowStock = lowStockQuery.data?.items ?? []
  const recent = recentQuery.data?.items ?? []
  const maxSold = Math.max(...topProducts.map((item) => item.quantity_sold), 1)

  const stats = [
    {
      label: t("dashboard.todayTransactions"),
      value: summary?.today_transactions ?? 0,
      hint: t("reports.today"),
      icon: ShoppingBag,
      tone: "bg-espresso/[0.06] text-espresso",
    },
    {
      label: t("dashboard.monthRevenue"),
      value: formatCurrency(summary?.month_revenue ?? 0),
      hint: `${summary?.month_transactions ?? 0} ${t("dashboard.transactions")}`,
      icon: TrendingUp,
      tone: "bg-success/10 text-success",
    },
    {
      label: t("dashboard.lowStock"),
      value: summary?.low_stock_ingredients ?? lowStock.length,
      hint: t("dashboard.lowStockHint"),
      icon: TriangleAlert,
      tone: "bg-warning/10 text-warning",
    },
  ]

  return (
    <div className="space-y-7">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
        actions={
          <>
            <Button asChild>
              <Link to="/pos">
                <Plus className="h-4 w-4" />
                {t("dashboard.newSale")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products">
                <Coffee className="h-4 w-4" />
                {t("dashboard.addProduct")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <Card className="relative overflow-hidden border-espresso bg-espresso text-cream md:col-span-2 xl:col-span-1">
          <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full bg-amber/25 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.16]" />
          <CardContent className="relative flex h-full flex-col p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-cream/60">
                {t("dashboard.todayRevenue")}
              </p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-white/10 text-amber">
                <Wallet className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} />
              </span>
            </div>
            {summaryQuery.isLoading ? (
              <Skeleton className="mt-6 h-11 w-40 bg-white/10" />
            ) : (
              <p className="tabular mt-5 font-display text-[2.6rem] font-semibold leading-none tracking-[-0.02em]">
                {formatCurrency(summary?.today_revenue ?? 0)}
              </p>
            )}
            <div className="mt-auto flex items-end justify-between gap-3 pt-5">
              <p className="text-xs text-cream/55">
                {summary?.today_transactions ?? 0} {t("dashboard.transactions")}
              </p>
              <Link
                to="/reports"
                className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-amber transition hover:text-amber/80"
              >
                {t("dashboard.viewAll")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[0.7rem] font-semibold uppercase leading-relaxed tracking-[0.08em] text-muted">
                  {stat.label}
                </p>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.65rem]",
                    stat.tone,
                  )}
                >
                  <stat.icon className="h-4 w-4" strokeWidth={1.8} />
                </div>
              </div>
              {summaryQuery.isLoading ? (
                <Skeleton className="mt-5 h-8 w-28" />
              ) : (
                <p className="tabular mt-4 font-display text-[1.85rem] font-semibold leading-none tracking-[-0.02em] text-espresso">
                  {stat.value}
                </p>
              )}
              <p className="mt-auto truncate pt-2 text-xs text-muted">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>{t("dashboard.salesTrend")}</CardTitle>
              <CardDescription>{t("dashboard.salesTrendSubtitle")}</CardDescription>
            </div>
            <Link
              to="/reports"
              className="text-xs font-semibold text-caramel hover:underline"
            >
              {t("dashboard.viewAll")}
            </Link>
          </CardHeader>
          <CardContent>
            {salesQuery.isLoading ? (
              <Skeleton className="h-[19rem] w-full" />
            ) : sales.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title={t("dashboard.noSales")}
                description={t("dashboard.noSalesHint")}
              />
            ) : (
              <div className="h-[19rem] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={sales}
                    margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9C4A2F" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#9C4A2F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#EFE6DA" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value: string) => formatShortDate(value, i18n.language)}
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
                      formatter={(value) => [formatCurrency(Number(value)), t("dashboard.todayRevenue")]}
                      labelFormatter={(label) => formatShortDate(String(label), i18n.language)}
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid #E7DCD0",
                        boxShadow: "0 24px 50px -28px rgba(34,25,19,0.35)",
                        fontSize: 12,
                        background: "#FFFDFB",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#9C4A2F"
                      strokeWidth={2.5}
                      fill="url(#revenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
            <CardDescription>{t("dashboard.inventoryHealth")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <Link
              to="/pos"
              className="group flex items-center gap-3 rounded-[0.95rem] border border-border/80 bg-cream/45 p-3 transition hover:border-caramel/30 hover:bg-cream"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.75rem] bg-caramel/10 text-caramel">
                <ShoppingBag className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-espresso">
                  {t("dashboard.newSale")}
                </p>
                <p className="truncate text-xs text-muted">{t("pos.subtitle")}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-caramel" />
            </Link>

            <Link
              to="/stock"
              className="group flex items-center gap-3 rounded-[0.95rem] border border-border/80 bg-cream/45 p-3 transition hover:border-caramel/30 hover:bg-cream"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.75rem] bg-warning/10 text-warning">
                <TriangleAlert className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-espresso">
                  {t("dashboard.manageStock")}
                </p>
                <p className="truncate text-xs text-muted">
                  {lowStock.length > 0
                    ? t("dashboard.lowStockItems", { count: lowStock.length })
                    : t("dashboard.allGood")}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-caramel" />
            </Link>

            <div className="relative mt-auto overflow-hidden rounded-[1rem] bg-espresso p-4 text-cream">
              <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-amber/20 blur-2xl" />
              <p className="relative text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-cream/55">
                {t("dashboard.averageOrder")}
              </p>
              <p className="tabular relative mt-2 font-display text-[1.9rem] font-semibold leading-none">
                {formatCurrency(
                  summary && summary.total_transactions > 0
                    ? Math.round(summary.total_revenue / summary.total_transactions)
                    : 0,
                )}
              </p>
              <p className="relative mt-2 text-xs text-cream/60">
                {summary?.total_transactions ?? 0} {t("dashboard.transactions")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.topProducts")}</CardTitle>
            <CardDescription>{t("dashboard.topProductsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProductsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <EmptyState icon={Coffee} title={t("dashboard.noSales")} />
            ) : (
              topProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center gap-3">
                  <span className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream text-[0.7rem] font-bold text-caramel">
                    {index + 1}
                  </span>
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
                          style={{ width: `${(product.quantity_sold / maxSold) * 100}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[0.7rem] text-muted">
                        {product.quantity_sold} {t("dashboard.sold")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>{t("dashboard.lowStock")}</CardTitle>
              <CardDescription>{t("dashboard.lowStockHint")}</CardDescription>
            </div>
            <Badge variant={lowStock.length > 0 ? "danger" : "success"}>
              {lowStock.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : lowStock.length === 0 ? (
              <EmptyState
                icon={Coffee}
                title={t("dashboard.noLowStock")}
                description={t("dashboard.noLowStockHint")}
              />
            ) : (
              lowStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-[0.95rem] border border-border/80 bg-cream/40 px-3.5 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-espresso">{item.name}</p>
                    <p className="tabular mt-0.5 text-xs text-muted">
                      {Number(item.stock)} / {Number(item.minimum_stock)} {item.unit}
                    </p>
                  </div>
                  <Badge variant="danger">{t("status.low")}</Badge>
                </div>
              ))
            )}
            {lowStock.length > 0 && (
              <Button variant="outline" className="w-full" asChild>
                <Link to="/stock">{t("dashboard.manageStock")}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{t("dashboard.recentTransactions")}</CardTitle>
            <CardDescription>{t("dashboard.recentSubtitle")}</CardDescription>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-caramel hover:underline"
          >
            {t("dashboard.viewAll")}
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {recentQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={t("dashboard.noSales")}
              description={t("dashboard.noSalesHint")}
            />
          ) : (
            <div className="-mx-5 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[580px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3 font-semibold sm:px-6">Invoice</th>
                    <th className="px-3 py-3 font-semibold">{t("transactions.cashier")}</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      {t("common.total")}
                    </th>
                    <th className="px-3 py-3 font-semibold">{t("common.status")}</th>
                    <th className="px-5 py-3 text-right font-semibold sm:px-6">
                      {t("common.time")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-border/60 transition-colors last:border-0 hover:bg-cream/40"
                    >
                      <td className="px-5 py-3.5 font-semibold text-espresso sm:px-6">
                        {transaction.invoice_number}
                      </td>
                      <td className="px-3 py-3.5 text-muted">
                        {transaction.user_name ?? "-"}
                      </td>
                      <td className="tabular px-3 py-3.5 text-right font-semibold">
                        {formatCurrency(transaction.total)}
                      </td>
                      <td className="px-3 py-3.5">
                        <TransactionStatusBadge status={transaction.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-muted sm:px-6">
                        {new Intl.DateTimeFormat(
                          i18n.language === "id" ? "id-ID" : "en-GB",
                          { dateStyle: "short", timeStyle: "short" },
                        ).format(new Date(transaction.created_at))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
