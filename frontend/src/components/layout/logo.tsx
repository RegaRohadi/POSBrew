import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  compact?: boolean
  tone?: "light" | "dark"
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-10", className)}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="17" fill="#221913" />
      <path
        d="M27 15.5C25 18 25 20.5 27 23"
        stroke="#D08A4E"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M37 15.5C35 18 35 20.5 37 23"
        stroke="#D08A4E"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <g transform="rotate(-24 32 38)">
        <ellipse cx="32" cy="38" rx="12.5" ry="17" fill="#F7F2EC" />
        <path
          d="M32 22.5C26 28.5 26 47.5 32 53.5"
          stroke="#9C4A2F"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

export function Logo({ className, compact = false, tone = "dark" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      {!compact && (
        <div className="leading-none">
          <span
            className={cn(
              "font-brand text-[1.42rem] font-semibold leading-none tracking-[-0.03em]",
              tone === "dark" ? "text-espresso" : "text-cream",
            )}
          >
            POS
            <span className={tone === "dark" ? "text-caramel" : "text-amber"}>
              Brew
            </span>
          </span>
          <p
            className={cn(
              "mt-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em]",
              tone === "dark" ? "text-muted" : "text-cream/55",
            )}
          >
            Coffee POS
          </p>
        </div>
      )}
    </div>
  )
}
