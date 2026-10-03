"use client"

import { SlidersHorizontal } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface AdminPageHeaderFilterButtonProps {
  onClick: () => void
  active?: boolean
  "aria-label": string
  className?: string
}

export function AdminPageHeaderFilterButton({
  onClick,
  active,
  "aria-label": ariaLabel,
  className,
}: AdminPageHeaderFilterButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "size-10 shrink-0 rounded-xl border-border lg:hidden",
        active && "border-primary text-primary",
        className
      )}
    >
      <SlidersHorizontal />
    </Button>
  )
}
