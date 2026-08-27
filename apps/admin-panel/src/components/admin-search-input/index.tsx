"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Search, X } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface AdminSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: AdminSearchInputProps) {
  const t = useTranslations("common")
  const effectivePlaceholder = placeholder ?? t("searchPlaceholder")

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={effectivePlaceholder}
        className="ps-11 pe-11"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange("")}
          className="absolute end-2.5 top-1/2 size-8 -translate-y-1/2 rounded-xl text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}
