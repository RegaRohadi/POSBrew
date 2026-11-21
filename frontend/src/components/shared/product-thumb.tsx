import { Coffee } from "lucide-react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

const productImages: Record<string, string> = {
  espresso: "/products/espresso.jpg",
  americano: "/products/americano.jpg",
  cappuccino: "/products/cappuccino.jpg",
  latte: "/products/latte.jpg",
  mocha: "/products/mocha.jpg",
  "matcha latte": "/products/matcha-latte.jpg",
  chocolate: "/products/hot-chocolate.jpg",
  "hot chocolate": "/products/hot-chocolate.jpg",
  "lychee tea": "/products/lychee-tea.jpg",
  "lemon tea": "/products/lemon-tea.jpg",
  croissant: "/products/croissant.jpg",
  "chocolate croissant": "/products/chocolate-croissant.jpg",
  "french fries": "/products/french-fries.jpg",
  fries: "/products/french-fries.jpg",
}

const fallbackMatchers: Array<[string[], string]> = [
  [["chocolate croissant", "pain au chocolat"], "/products/chocolate-croissant.jpg"],
  [["french fries", "fries"], "/products/french-fries.jpg"],
  [["matcha"], "/products/matcha-latte.jpg"],
  [["mocha"], "/products/mocha.jpg"],
  [["cappuccino"], "/products/cappuccino.jpg"],
  [["americano"], "/products/americano.jpg"],
  [["espresso"], "/products/espresso.jpg"],
  [["latte"], "/products/latte.jpg"],
  [["lychee"], "/products/lychee-tea.jpg"],
  [["lemon"], "/products/lemon-tea.jpg"],
  [["chocolate", "cokelat"], "/products/hot-chocolate.jpg"],
  [["croissant"], "/products/croissant.jpg"],
  [["tea"], "/products/lemon-tea.jpg"],
]

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** Resolve a product photo from the seed catalog, so products look complete even without image_url. */
export function productImageFor(name: string) {
  const normalized = normalizeName(name)
  if (!normalized) return undefined
  if (productImages[normalized]) return productImages[normalized]

  for (const [keywords, image] of fallbackMatchers) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return image
  }

  return undefined
}

const palettes = [
  "from-amber/25 to-caramel/10 text-caramel",
  "from-[#DDE8DC] to-[#F2F5EF] text-success",
  "from-[#EADFD3] to-[#F7F1EA] text-caramel",
  "from-[#E4E0EF] to-[#F3F1F8] text-[#6E5B8A]",
  "from-[#F3E3D6] to-[#FBF4ED] text-[#B06A3C]",
]

function paletteFor(name: string) {
  const total = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return palettes[total % palettes.length]
}

interface ProductThumbProps {
  name: string
  imageUrl?: string | null
  className?: string
  iconClassName?: string
}

export function ProductThumb({
  name,
  imageUrl,
  className,
  iconClassName,
}: ProductThumbProps) {
  const source = imageUrl || productImageFor(name)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [source])

  if (source && !failed) {
    return (
      <img
        src={source}
        alt={name}
        decoding="async"
        onError={() => setFailed(true)}
        className={cn(
          "h-11 w-11 shrink-0 rounded-[0.8rem] object-cover",
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.8rem] bg-gradient-to-br",
        paletteFor(name),
        className,
      )}
    >
      <Coffee className={cn("h-5 w-5", iconClassName)} strokeWidth={1.8} />
    </div>
  )
}
