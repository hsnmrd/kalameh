import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export function FieldGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex w-full flex-col gap-6", className)} {...props} />
  )
}

export function Field({
  className,
  "data-invalid": dataInvalid,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { "data-invalid"?: boolean }) {
  return (
    <div
      data-invalid={dataInvalid}
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    />
  )
}

export function FieldLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "ml-0.5 text-sm leading-none font-medium text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
}

export function FieldError({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null
  return (
    <p
      className={cn("mt-1 text-[13px] font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function FieldDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-[13px] text-slate-500", className)} {...props} />
  )
}
