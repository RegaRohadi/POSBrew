import { forwardRef, type InputHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-12 w-full rounded-[0.9rem] border border-border bg-surface px-4 text-sm text-espresso shadow-[0_1px_2px_rgba(34,25,19,0.03)] outline-none transition placeholder:text-muted/80 focus:border-caramel/70 focus:ring-4 focus:ring-caramel/10 disabled:cursor-not-allowed disabled:bg-cream disabled:opacity-70",
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = "Input"
