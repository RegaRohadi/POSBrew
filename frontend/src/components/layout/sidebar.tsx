import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Boxes,
  Coffee,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Ruler,
  ShoppingCart,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { Logo, LogoMark } from "@/components/layout/logo"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth"

interface NavItem {
  to: string
  labelKey: string
  icon: LucideIcon
  adminOnly?: boolean
}

interface NavSection {
  titleKey: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    titleKey: "nav.operations",
    items: [
      {
        to: "/",
        labelKey: "nav.dashboard",
        icon: LayoutDashboard,
        adminOnly: true,
      },
      { to: "/pos", labelKey: "nav.pos", icon: ShoppingCart },
    ],
  },
  {
    titleKey: "nav.catalog",
    items: [
      { to: "/products", labelKey: "nav.products", icon: Coffee },
      {
        to: "/categories",
        labelKey: "nav.categories",
        icon: Tags,
        adminOnly: true,
      },
      { to: "/units", labelKey: "nav.units", icon: Ruler, adminOnly: true },
      { to: "/recipes", labelKey: "nav.recipes", icon: BookOpen },
    ],
  },
  {
    titleKey: "nav.inventory",
    items: [
      { to: "/ingredients", labelKey: "nav.ingredients", icon: Boxes },
      { to: "/stock", labelKey: "nav.stock", icon: ArrowLeftRight },
    ],
  },
  {
    titleKey: "nav.sales",
    items: [
      { to: "/transactions", labelKey: "nav.transactions", icon: ReceiptText },
      {
        to: "/reports",
        labelKey: "nav.reports",
        icon: BarChart3,
        adminOnly: true,
      },
    ],
  },
  {
    titleKey: "nav.admin",
    items: [{ to: "/users", labelKey: "nav.users", icon: Users, adminOnly: true }],
  },
]

interface SidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
}

export function Sidebar({ open, collapsed, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const isAdmin = user?.role?.name === "admin"

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-espresso/45 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-white/[0.06] bg-espresso text-cream transition-[width,transform] duration-300 ease-out lg:w-[var(--sidebar-width)] lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(340px_220px_at_20%_0%,rgba(208,138,78,0.14),transparent_70%)]" />

        <div
          className={cn(
            "relative flex items-center justify-between px-6 pb-7 pt-6",
            collapsed && "lg:justify-center lg:px-4",
          )}
        >
          <Logo tone="light" className="lg:hidden" />
          <div className="hidden lg:block">
            {collapsed ? <LogoMark className="h-10 w-10" /> : <Logo tone="light" />}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-cream/60 transition hover:bg-white/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 lg:hidden"
            aria-label={t("common.close")}
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <nav
          className={cn(
            "relative flex-1 space-y-6 overflow-y-auto px-3.5 pb-5",
            collapsed && "lg:space-y-4 lg:px-2",
          )}
        >
          {sections.map((section) => {
            const items = section.items.filter(
              (item) => !item.adminOnly || isAdmin,
            )
            if (items.length === 0) return null

            return (
              <div key={section.titleKey}>
                <p
                  className={cn(
                    "px-3 pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-cream/55",
                    collapsed && "lg:hidden",
                  )}
                >
                  {t(section.titleKey)}
                </p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onClose}
                      aria-label={t(item.labelKey)}
                      title={collapsed ? t(item.labelKey) : undefined}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex h-11 items-center gap-3 rounded-[0.8rem] px-3 text-[0.875rem] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/50",
                          collapsed && "lg:justify-center lg:gap-0 lg:px-0",
                          isActive
                            ? "bg-white/[0.085] text-cream"
                            : "text-cream/60 hover:bg-white/[0.045] hover:text-cream/90",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-amber transition-opacity",
                              isActive ? "opacity-100" : "opacity-0",
                            )}
                            aria-hidden="true"
                          />
                          <item.icon
                            className={cn(
                              "h-[1.15rem] w-[1.15rem] shrink-0 transition-colors",
                              isActive
                                ? "text-amber"
                                : "text-cream/45 group-hover:text-cream/75",
                            )}
                            strokeWidth={1.8}
                          />
                          <span className={cn(collapsed && "lg:hidden")}>
                            {t(item.labelKey)}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div
          className={cn(
            "relative border-t border-white/10 px-4 py-4",
            collapsed && "lg:px-2",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 rounded-[0.9rem] px-1 py-1",
              collapsed && "lg:flex-col lg:items-center lg:gap-2 lg:px-0",
            )}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber/25 bg-amber/15 text-[0.78rem] font-bold tracking-wide text-amber"
              title={user?.name}
            >
              {user?.name
                ?.split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("") ?? "PB"}
            </div>
            <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
              <p className="truncate text-[0.875rem] font-semibold text-cream">
                {user?.name}
              </p>
              <p className="mt-0.5 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-cream/55">
                {user?.role?.name === "admin"
                  ? t("auth.admin")
                  : t("auth.cashier")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "rounded-[0.7rem] p-2.5 text-cream/55 transition hover:bg-white/10 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/50",
                collapsed && "lg:mx-auto",
              )}
              title={t("auth.logout")}
              aria-label={t("auth.logout")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
