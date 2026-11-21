import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "accent"
  | "dark"
  | "outline"

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-cream-dark text-espresso",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  accent: "bg-amber/15 text-caramel",
  dark: "bg-espresso text-cream",
  outline: "border border-border bg-transparent text-muted",
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold leading-none tracking-[0.005em]",
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
