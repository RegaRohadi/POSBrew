import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-3xl">
        <h1 className="font-display text-[2.15rem] font-semibold leading-[1.04] tracking-[-0.02em] text-espresso sm:text-[2.65rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-muted sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  )
}
