import { Search } from "lucide-react"
import type { ChangeEvent, ReactNode } from "react"

import { cn } from "@/lib/utils"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  trailing?: ReactNode
  ariaLabel?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  trailing,
  ariaLabel,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-muted/80" />
      <input
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="h-12 w-full rounded-[0.9rem] border border-border bg-surface pl-11 pr-12 text-sm text-espresso shadow-[0_1px_2px_rgba(34,25,19,0.03)] outline-none transition placeholder:text-muted/80 focus:border-caramel/70 focus:ring-4 focus:ring-caramel/10"
      />
      {trailing && (
        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
          {trailing}
        </div>
      )}
    </div>
  )
}
