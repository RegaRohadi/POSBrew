import { Suspense, useState, type CSSProperties } from "react"
import { Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

const SIDEBAR_STORAGE_KEY = "posbrew.sidebar.collapsed"

function readSidebarPreference() {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-caramel/20 border-t-caramel" />
    </div>
  )
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarPreference)
  const { t } = useTranslation()

  const toggleSidebar = () => {
    setSidebarCollapsed((previous) => {
      const next = !previous
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0")
      } catch {
        // Storage can be unavailable in private windows; the UI still works.
      }
      return next
    })
  }

  return (
    <div
      className="min-h-screen bg-cream"
      style={
        {
          "--sidebar-width": sidebarCollapsed ? "5.25rem" : "17rem",
        } as CSSProperties
      }
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-espresso focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-cream"
      >
        {t("common.skipToContent")}
      </a>
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="transition-[padding-left] duration-300 ease-out lg:pl-[var(--sidebar-width)]">
        <Topbar
          onMenu={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1560px] px-4 py-7 sm:px-6 sm:py-9 lg:px-9 lg:py-10"
        >
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
