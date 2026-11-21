import { Globe2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  const current = i18n.language.startsWith("en") ? "en" : "id"

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-[0_1px_2px_rgba(34,25,19,0.04)]",
        className,
      )}
    >
      <Globe2 className="ml-1.5 h-3.5 w-3.5 text-muted" strokeWidth={1.8} />
      {(["id", "en"] as const).map((language) => (
        <button
          key={language}
          type="button"
          onClick={() => void i18n.changeLanguage(language)}
          aria-label={language === "id" ? "Bahasa Indonesia" : "English"}
          className={cn(
            "rounded-full px-2.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.04em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel/40",
            current === language
              ? "bg-espresso text-cream"
              : "text-muted hover:text-espresso",
          )}
        >
          {language}
        </button>
      ))}
    </div>
  )
}
