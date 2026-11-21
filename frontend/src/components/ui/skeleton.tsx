import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-[0.9rem] bg-cream-dark/90", className)}
    />
  )
}
