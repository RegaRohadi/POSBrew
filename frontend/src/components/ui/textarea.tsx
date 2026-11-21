import { forwardRef, type TextareaHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[104px] w-full resize-y rounded-[0.9rem] border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-espresso shadow-[0_1px_2px_rgba(34,25,19,0.03)] outline-none transition placeholder:text-muted/80 focus:border-caramel/70 focus:ring-4 focus:ring-caramel/10 disabled:cursor-not-allowed disabled:bg-cream disabled:opacity-70",
      className,
    )}
    {...props}
  />
))

Textarea.displayName = "Textarea"
