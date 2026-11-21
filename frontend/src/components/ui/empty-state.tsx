import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-[1.1rem] border border-border/70 bg-cream text-caramel">
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-[0.95rem] font-semibold text-espresso">{title}</p>
        {description && (
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
