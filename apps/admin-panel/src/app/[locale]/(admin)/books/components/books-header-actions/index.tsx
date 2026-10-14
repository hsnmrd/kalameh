"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"

export interface BooksHeaderActionsProps {
  totalCount: number
}

export function BooksHeaderActions({ totalCount }: BooksHeaderActionsProps) {
  const t = useTranslations("books")

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
        {totalCount} {t("title")}
      </Badge>
    </div>
  )
}
