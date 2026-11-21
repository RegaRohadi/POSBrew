import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"
import { forwardRef, type ButtonHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg" | "icon"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  asChild?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-caramel text-white shadow-[0_10px_24px_-14px_rgba(156,74,47,0.75)] hover:bg-caramel-hover active:bg-caramel-hover",
  secondary:
    "bg-espresso text-cream shadow-[0_10px_24px_-16px_rgba(34,25,19,0.7)] hover:bg-espresso-soft active:bg-espresso-soft",
  outline:
    "border border-border bg-surface text-espresso shadow-[0_1px_2px_rgba(34,25,19,0.04)] hover:border-espresso/20 hover:bg-cream",
  ghost: "text-muted hover:bg-cream-dark/70 hover:text-espresso",
  danger:
    "bg-danger text-white shadow-[0_10px_24px_-16px_rgba(184,74,68,0.7)] hover:bg-danger/90",
}

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-[0.7rem] px-3.5 text-xs",
  md: "h-11 rounded-[0.85rem] px-4.5 text-sm",
  lg: "h-12 rounded-[0.95rem] px-6 text-sm",
  icon: "h-10 w-10 rounded-[0.8rem]",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,box-shadow,transform,color] duration-150 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel/45 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:pointer-events-none disabled:opacity-50",
      variants[variant],
      sizes[size],
      className,
    )

    if (asChild) {
      return (
        <Slot ref={ref} className={classes} {...props}>
          {children}
        </Slot>
      )
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  },
)

Button.displayName = "Button"
