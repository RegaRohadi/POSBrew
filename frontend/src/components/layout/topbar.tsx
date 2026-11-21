import {
  CalendarDays,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { LogoMark } from "@/components/layout/logo"
import { LanguageToggle } from "@/components/shared/language-toggle"
import { formatDate } from "@/lib/format"
import { useAuthStore } from "@/stores/auth"

interface TopbarProps {
  onMenu: () => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function Topbar({
  onMenu,
  sidebarCollapsed,
  onToggleSidebar,
}: TopbarProps) {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const toggleLabel = sidebarCollapsed
    ? t("common.expandSidebar")
    : t("common.collapseSidebar")

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-9">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-[0.8rem] border border-border bg-surface p-2.5 text-espresso shadow-sm transition hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel/40 lg:hidden"
          aria-label={t("common.menu")}
        >
          <Menu className="h-4 w-4" strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-10 w-10 items-center justify-center rounded-[0.8rem] border border-border/80 bg-surface text-muted shadow-[0_1px_2px_rgba(34,25,19,0.04)] transition hover:bg-cream hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel/40 lg:inline-flex"
          aria-label={toggleLabel}
          title={toggleLabel}
          aria-expanded={!sidebarCollapsed}
          aria-controls="app-sidebar"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.8} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.8} />
          )}
        </button>

        <div className="flex items-center gap-2.5 lg:hidden">
          <LogoMark className="h-9 w-9" />
          <span className="font-brand text-lg font-semibold tracking-[-0.02em] text-espresso">
            POS<span className="text-caramel">Brew</span>
          </span>
        </div>

        <div className="hidden items-center gap-2 text-[0.82rem] font-medium text-muted sm:flex">
          <CalendarDays className="h-4 w-4 text-muted/80" strokeWidth={1.8} />
          <span>{formatDate(new Date().toISOString(), i18n.language)}</span>
        </div>

        <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
          <LanguageToggle />
          <div className="hidden items-center gap-2.5 rounded-full border border-border bg-surface py-1 pl-1 pr-3.5 shadow-[0_1px_2px_rgba(34,25,19,0.04)] sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-espresso text-[0.7rem] font-bold text-cream">
              {user?.name
                ?.split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("") ?? "PB"}
            </div>
            <div className="leading-tight">
              <p className="max-w-[9rem] truncate text-[0.8rem] font-semibold text-espresso">
                {user?.name}
              </p>
              <p className="mt-0.5 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-muted">
                {user?.role?.name === "admin"
                  ? t("auth.admin")
                  : t("auth.cashier")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
