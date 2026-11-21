import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react"

import { cn } from "@/lib/utils"

interface FieldProps {
  label?: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FieldProps) {
  const generatedId = useId()
  const labelId = `${generatedId}-label`
  const childId =
    !htmlFor && isValidElement(children)
      ? (children.props as { id?: string }).id
      : undefined
  const controlId = htmlFor ?? childId ?? generatedId

  // When no htmlFor is supplied, label the single control directly so the
  // visible label also becomes its accessible name.
  const labelledChildren =
    !htmlFor && isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          id: childId ?? controlId,
          "aria-labelledby":
            (children.props as Record<string, unknown>)["aria-labelledby"] ??
            (label ? labelId : undefined),
        })
      : children

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label
          id={labelId}
          htmlFor={controlId}
          className="flex items-center gap-1 text-[0.82rem] font-semibold tracking-[0.005em] text-espresso/90"
        >
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      {labelledChildren}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
