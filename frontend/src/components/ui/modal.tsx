import { X } from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

type ModalSize = "sm" | "md" | "lg" | "xl"

const sizes: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  className?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-[1.75rem] border border-border bg-surface p-0 text-espresso shadow-float backdrop:bg-espresso/55 backdrop:backdrop-blur-sm",
        sizes[size],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-7 sm:py-5">
        <div>
          <h2
            id="modal-title"
            className="font-display text-[1.6rem] font-semibold leading-tight tracking-[-0.02em]"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="mt-0.5 rounded-full p-2.5 text-muted transition hover:bg-cream hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel/40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
        {children}
      </div>
      {footer && (
        <div className="flex flex-wrap justify-end gap-2.5 border-t border-border px-5 py-4 sm:px-7">
          {footer}
        </div>
      )}
    </dialog>
  )
}
