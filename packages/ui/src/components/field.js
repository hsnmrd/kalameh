import { jsx as _jsx } from "react/jsx-runtime"
import { cn } from "@workspace/ui/lib/utils"
export function FieldGroup({ className, ...props }) {
  return _jsx("div", {
    className: cn("flex w-full flex-col gap-6", className),
    ...props,
  })
}
export function Field({ className, "data-invalid": dataInvalid, ...props }) {
  return _jsx("div", {
    "data-invalid": dataInvalid,
    className: cn("flex w-full flex-col gap-2", className),
    ...props,
  })
}
export function FieldLabel({ className, ...props }) {
  return _jsx("label", {
    className: cn(
      "ml-0.5 text-sm leading-none font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    ),
    ...props,
  })
}
export function FieldError({ className, children, ...props }) {
  if (!children) return null
  return _jsx("p", {
    className: cn("mt-1 text-[13px] font-medium text-destructive", className),
    ...props,
    children: children,
  })
}
export function FieldDescription({ className, ...props }) {
  return _jsx("p", {
    className: cn("text-[13px] text-muted-foreground", className),
    ...props,
  })
}
