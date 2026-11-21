import { ChevronDown } from "lucide-react"
import { forwardRef, type SelectHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "h-12 w-full appearance-none rounded-[0.9rem] border border-border bg-surface pl-4 pr-10 text-sm text-espresso shadow-[0_1px_2px_rgba(34,25,19,0.03)] outline-none transition focus:border-caramel/70 focus:ring-4 focus:ring-caramel/10 disabled:cursor-not-allowed disabled:bg-cream disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
  </div>
))

Select.displayName = "Select"
