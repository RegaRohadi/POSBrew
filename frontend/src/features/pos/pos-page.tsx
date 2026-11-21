import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Banknote,
  Coffee,
  CreditCard,
  Minus,
  Plus,
  Printer,
  QrCode,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ProductThumb } from "@/components/shared/product-thumb"
import { Receipt } from "@/components/shared/receipt"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { PageHeader } from "@/components/ui/page-header"
import { SearchInput } from "@/components/ui/search-input"
import { Skeleton } from "@/components/ui/skeleton"
import { categoryApi, productApi, transactionApi } from "@/lib/api"
import { apiErrorMessage } from "@/lib/errors"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { PaymentMethod, Product, Transaction, TransactionInput } from "@/types"

interface CartItem {
  product: Product
  quantity: number
}

const paymentMethods: Array<{
  value: PaymentMethod
  labelKey: string
  icon: typeof Banknote
}> = [
  { value: "cash", labelKey: "pos.cash", icon: Banknote },
  { value: "qris", labelKey: "pos.qris", icon: QrCode },
  { value: "debit", labelKey: "pos.debit", icon: CreditCard },
]

export function PosPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [amountPaid, setAmountPaid] = useState("")
  const [amountTouched, setAmountTouched] = useState(false)
  const [receipt, setReceipt] = useState<Transaction | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)

  const productsQuery = useQuery({
    queryKey: ["products", "pos"],
    queryFn: () => productApi.list({ page: 1, limit: 100 }),
  })
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.list,
  })

  const products = productsQuery.data?.items ?? []
  const categories = categoriesQuery.data ?? []

  const categoryCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const product of products) {
      if (product.category_id === null) continue
      counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1)
    }
    return counts
  }, [products])

  const filteredProducts = products.filter((product) => {
    const matchesCategory = categoryId === null || product.category_id === categoryId
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.trim().toLowerCase())
    return matchesCategory && matchesSearch
  })

  const subtotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  )
  const rawDiscount = Number(discount) || 0
  const total = Math.max(subtotal - rawDiscount, 0)
  const paid = method === "cash" ? Number(amountPaid) || 0 : total
  const change = Math.max(paid - total, 0)
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0)

  useEffect(() => {
    if (method !== "cash") {
      setAmountPaid(String(total))
      return
    }
    if (!amountTouched) {
      setAmountPaid(total > 0 ? String(total) : "")
    }
  }, [amountTouched, method, total])

  const addToCart = (product: Product) => {
    if (!product.is_available) return
    setCart((previous) => {
      const existing = previous.find((item) => item.product.id === product.id)
      if (existing) {
        return previous.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }
      return [...previous, { product, quantity: 1 }]
    })
  }

  const changeQuantity = (productId: number, delta: number) => {
    setCart((previous) =>
      previous.flatMap((item) => {
        if (item.product.id !== productId) return [item]
        const quantity = item.quantity + delta
        return quantity <= 0 ? [] : [{ ...item, quantity }]
      }),
    )
  }

  const checkoutMutation = useMutation({
    mutationFn: (body: TransactionInput) => transactionApi.create(body),
    onSuccess: (transaction) => {
      toast.success(t("pos.checkoutSuccess"))
      setReceipt(transaction)
      setReceiptOpen(true)
      setCart([])
      setDiscount("")
      setAmountPaid("")
      setAmountTouched(false)
      setMethod("cash")
      void queryClient.invalidateQueries({ queryKey: ["products"] })
      void queryClient.invalidateQueries({ queryKey: ["ingredients"] })
      void queryClient.invalidateQueries({ queryKey: ["stock-movements"] })
      void queryClient.invalidateQueries({ queryKey: ["transactions"] })
      void queryClient.invalidateQueries({ queryKey: ["reports"] })
    },
    onError: (error) => toast.error(apiErrorMessage(error, t)),
  })

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error(t("pos.emptyCartError"))
      return
    }
    if (rawDiscount > subtotal) {
      toast.error(t("pos.discountTooLarge"))
      return
    }
    if (paid < total) {
      toast.error(t("pos.insufficientPayment"))
      return
    }

    checkoutMutation.mutate({
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      discount: rawDiscount,
      payment_method: method,
      payment_amount: paid,
    })
  }

  return (
    <div className="pb-28 xl:pb-0">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section className="min-w-0 space-y-6">
          <PageHeader title={t("pos.title")} description={t("pos.subtitle")} />

          <div className="sticky top-[4.6rem] z-20 -mx-1 space-y-3 bg-cream/90 px-1 py-3 backdrop-blur-xl">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("pos.searchProducts")}
            />
            <div className="flex w-full min-w-0 items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
              <CategoryPill
                active={categoryId === null}
                label={t("pos.allCategories")}
                count={products.length}
                onClick={() => setCategoryId(null)}
              />
              {categories.map((category) => (
                <CategoryPill
                  key={category.id}
                  active={categoryId === category.id}
                  label={category.name}
                  count={categoryCounts.get(category.id) ?? 0}
                  onClick={() => setCategoryId(category.id)}
                />
              ))}
            </div>
          </div>

          {productsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-[17.5rem] w-full rounded-[1.3rem]" />
              ))}
            </div>
          ) : productsQuery.isError ? (
            <Card className="mt-3">
              <EmptyState
                icon={ShoppingBag}
                title={t("errors.loadFailed")}
                description={t("errors.network")}
                action={
                  <Button variant="outline" onClick={() => productsQuery.refetch()}>
                    {t("common.refresh")}
                  </Button>
                }
              />
            </Card>
          ) : filteredProducts.length === 0 ? (
            <Card className="mt-3">
              <EmptyState
                icon={Coffee}
                title={t("pos.noProducts")}
                description={t("pos.noProductsHint")}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id)
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={!product.is_available}
                    className={cn(
                      "group relative flex min-w-0 flex-col overflow-hidden rounded-[1.3rem] border border-border/80 bg-surface text-left shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
                      !product.is_available &&
                        "cursor-not-allowed opacity-70 hover:translate-y-0 hover:shadow-card",
                    )}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-cream-dark">
                      <ProductThumb
                        name={product.name}
                        imageUrl={product.image_url}
                        className="h-full w-full rounded-none object-cover transition duration-500 ease-out group-hover:scale-[1.045]"
                        iconClassName="h-10 w-10"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/45 via-espresso/0 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95" />

                      {product.category?.name && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-cream/95 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-espresso shadow-sm backdrop-blur-sm">
                          {product.category.name}
                        </span>
                      )}

                      {inCart && (
                        <span className="absolute right-3 top-3 z-10 flex h-7 min-w-7 items-center justify-center rounded-full border border-cream/25 bg-espresso px-1.5 text-[0.7rem] font-bold text-cream shadow-sm">
                          {inCart.quantity}
                        </span>
                      )}

                      {!product.is_available && (
                        <span className="absolute inset-0 flex items-center justify-center bg-espresso/50 backdrop-blur-[2px]">
                          <span className="rounded-full bg-cream px-3.5 py-1.5 text-[0.72rem] font-semibold text-espresso">
                            {t("pos.unavailable")}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                      <p className="line-clamp-1 text-[0.95rem] font-semibold leading-snug tracking-[-0.005em] text-espresso">
                        {product.name}
                      </p>
                      <p className="mt-1 line-clamp-2 min-h-[2.3rem] text-xs leading-[1.4] text-muted">
                        {product.description || product.category?.name || "—"}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="tabular text-[0.92rem] font-semibold text-espresso">
                          {formatCurrency(product.price)}
                        </p>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-cream text-caramel transition-colors duration-200 group-hover:border-caramel group-hover:bg-caramel group-hover:text-white">
                          <Plus className="h-4 w-4" strokeWidth={2.2} />
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <aside className="min-w-0">
          <Card
            id="cart-panel"
            className="flex scroll-mt-24 flex-col overflow-hidden xl:sticky xl:top-[5.6rem] xl:h-[calc(100vh-8rem)] xl:max-h-[calc(100vh-8rem)]"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 text-[1.05rem] font-semibold tracking-[-0.01em] text-espresso">
                  <ShoppingCart className="h-4 w-4 text-caramel" strokeWidth={1.9} />
                  {t("pos.cart")}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {itemCount} {t("common.items")}
                </p>
              </div>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCart([])
                    setDiscount("")
                    setAmountPaid("")
                    setAmountTouched(false)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("pos.clear")}
                </Button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 pb-14 pt-6 text-center">
                <div className="relative mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-border/70 bg-cream/70 text-caramel">
                    <ShoppingBag className="h-8 w-8" strokeWidth={1.6} />
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-caramel text-white shadow-[0_6px_16px_-8px_rgba(156,74,47,0.8)]">
                    <Plus className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                </div>
                <p className="font-display text-xl font-semibold tracking-[-0.01em] text-espresso">
                  {t("pos.emptyCart")}
                </p>
                <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-muted">
                  {t("pos.emptyCartHint")}
                </p>
              </div>
            ) : (
              <>
                <div className="relative min-h-0 flex-1">
                  <div className="h-full overflow-y-auto px-4 py-4 sm:px-5">
                    <div className="space-y-2.5 pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-start gap-3 rounded-[0.95rem] border border-border/70 bg-cream/30 p-2.5"
                    >
                      <ProductThumb
                        name={item.product.name}
                        imageUrl={item.product.image_url}
                        className="h-12 w-12 rounded-[0.7rem]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.875rem] font-semibold text-espresso">
                          {item.product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatCurrency(item.product.price)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.product.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-[0.5rem] border border-border bg-surface text-muted transition hover:border-caramel/30 hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel/40"
                            aria-label={t("pos.decrease")}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="tabular min-w-5 text-center text-[0.8rem] font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.product.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-[0.5rem] border border-border bg-surface text-muted transition hover:border-caramel/30 hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel/40"
                            aria-label={t("pos.increase")}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="tabular text-[0.85rem] font-semibold text-espresso">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setCart((previous) =>
                              previous.filter(
                                (entry) => entry.product.id !== item.product.id,
                              ),
                            )
                          }
                          className="mt-1 inline-flex rounded-md p-1 text-muted transition hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
                          aria-label={t("common.remove")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                      ))}
                    </div>

                    <div className="mt-5 space-y-4 border-t border-border/70 pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t("pos.subtotal")}</span>
                  <span className="tabular font-semibold">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">{t("pos.discount")}</span>
                  <Input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                    className="h-9 w-28 rounded-[0.6rem] px-2.5 text-right text-xs"
                    placeholder="0"
                    aria-label={t("pos.discount")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  {t("pos.paymentMethod")}
                </p>
                <div className="rounded-[0.9rem] bg-cream p-1">
                  <div className="grid grid-cols-3 gap-1">
                    {paymentMethods.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMethod(option.value)}
                        className={cn(
                          "flex h-10 items-center justify-center gap-1.5 rounded-[0.65rem] px-1 text-[0.78rem] font-semibold transition-all",
                          method === option.value
                            ? "bg-surface text-espresso shadow-[0_1px_3px_rgba(34,25,19,0.12)] ring-1 ring-border/80"
                            : "text-muted hover:text-espresso",
                        )}
                      >
                        <option.icon className="h-4 w-4" strokeWidth={1.8} />
                        {t(option.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {method === "cash" ? (
                <div className="space-y-2">
                  <Field label={t("pos.amountPaid")}>
                    <Input
                      type="number"
                      min={0}
                      value={amountPaid}
                      onChange={(event) => {
                        setAmountTouched(true)
                        setAmountPaid(event.target.value)
                      }}
                      className="tabular h-11 text-right font-semibold"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setAmountTouched(true)
                        setAmountPaid(String(total))
                      }}
                    >
                      {t("pos.quickCash")}
                    </Button>
                    {[50000, 100000].map((value) => (
                      <Button
                        key={value}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="tabular flex-1"
                        onClick={() => {
                          setAmountTouched(true)
                          setAmountPaid(String(value))
                        }}
                      >
                        {new Intl.NumberFormat("id-ID").format(value)}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-[0.9rem] bg-cream px-3.5 py-3 text-sm">
                  <span className="text-muted">{t("pos.amountPaid")}</span>
                  <span className="tabular font-semibold">{formatCurrency(total)}</span>
                </div>
              )}

                    </div>
                  </div>
                  {cart.length > 2 && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-6 bg-gradient-to-t from-surface to-transparent xl:block" />
                  )}
                </div>

                <div className="shrink-0 border-t border-border/70 bg-cream/50 px-4 py-3.5 sm:px-5">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted">
                        {t("pos.total")}
                      </p>
                      <p className="tabular mt-1 truncate font-display text-[1.55rem] font-semibold leading-none text-espresso">
                        {formatCurrency(total)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted">
                        {t("pos.change")}
                      </p>
                      <p className="tabular mt-1 font-display text-lg font-semibold leading-none text-caramel">
                        {formatCurrency(change)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="mt-3 w-full"
                    onClick={handleCheckout}
                    loading={checkoutMutation.isPending}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {checkoutMutation.isPending ? t("pos.processing") : t("pos.checkout")}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-surface/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:left-[var(--sidebar-width)] xl:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted">
              {t("pos.total")} · {itemCount} {t("common.items")}
            </p>
            <p className="tabular mt-0.5 truncate font-display text-xl font-semibold">
              {formatCurrency(total)}
            </p>
          </div>
          <Button
            onClick={() =>
              document
                .getElementById("cart-panel")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            <ShoppingCart className="h-4 w-4" />
            {t("pos.openCart")} ({itemCount})
          </Button>
        </div>
      </div>

      <Modal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        title={t("pos.receipt")}
        description={receipt?.invoice_number}
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              {t("pos.printReceipt")}
            </Button>
            <Button onClick={() => setReceiptOpen(false)}>
              {t("pos.newOrder")}
            </Button>
          </>
        }
      >
        {receipt && (
          <div className="rounded-[1.1rem] border border-border bg-cream/40 p-3">
            <Receipt transaction={receipt} />
          </div>
        )}
      </Modal>
    </div>
  )
}

function CategoryPill({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[0.8rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel/40",
        active
          ? "border-espresso bg-espresso text-cream shadow-sm"
          : "border-border bg-surface text-muted hover:border-espresso/20 hover:text-espresso",
      )}
    >
      {label}
      <span
        className={cn(
          "tabular rounded-full px-1.5 py-0.5 text-[0.7rem] leading-none",
          active ? "bg-white/10 text-cream/65" : "bg-cream text-muted/80",
        )}
      >
        {count}
      </span>
    </button>
  )
}
