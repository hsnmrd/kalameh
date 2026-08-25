"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const emptyVariants = cva(
  "flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center text-card-foreground shadow-2xs",
  {
    variants: {
      variant: {
        default: "",
        ghost: "border-transparent bg-transparent shadow-none",
        compact: "min-h-[200px] p-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface EmptyProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyVariants> {}

export function Empty({ className, variant, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(emptyVariants({ variant }), className)}
      {...props}
    />
  )
}

export function EmptyHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex flex-col items-center gap-2", className)}
      {...props}
    />
  )
}

const emptyMediaVariants = cva(
  "flex items-center justify-center rounded-2xl transition-colors",
  {
    variants: {
      variant: {
        default: "size-14 bg-muted text-muted-foreground",
        icon: "size-14 bg-primary/10 text-primary",
        destructive: "size-14 bg-destructive/10 text-destructive",
        accent: "size-14 bg-accent text-accent-foreground",
        avatar: "size-16 rounded-full bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface EmptyMediaProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyMediaVariants> {}

export function EmptyMedia({ className, variant, ...props }: EmptyMediaProps) {
  return (
    <div
      data-slot="empty-media"
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    />
  )
}

export function EmptyTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="empty-title"
      className={cn("text-base font-bold text-foreground", className)}
      {...props}
    />
  )
}

export function EmptyDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="empty-description"
      className={cn(
        "max-w-md text-xs leading-relaxed text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export function EmptyContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "mt-6 flex flex-wrap items-center justify-center gap-3",
        className
      )}
      {...props}
    />
  )
}
