"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus, UserPlus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"

export interface StudentsHeaderProps {
  totalCount: number
  onAddStudentClick: () => void
}

export function StudentsHeader({
  totalCount,
  onAddStudentClick,
}: StudentsHeaderProps) {
  const t = useTranslations("students")

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <Badge variant="secondary" className="font-semibold">
            {totalCount}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Button
        onClick={onAddStudentClick}
        className="h-10 cursor-pointer gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
      >
        <Plus className="size-4" />
        <span>{t("addStudent")}</span>
      </Button>
    </div>
  )
}
