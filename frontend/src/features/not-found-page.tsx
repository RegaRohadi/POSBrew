import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth"

export function NotFoundPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-6 text-center">
      <Logo />
      <div>
        <p className="font-display text-7xl font-semibold text-caramel">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">
          {t("common.noResults")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("errors.notFound")}</p>
      </div>
      <Button asChild>
        <Link to={user?.role?.name === "admin" ? "/" : "/pos"}>
          {t("common.back")}
        </Link>
      </Button>
    </div>
  )
}
