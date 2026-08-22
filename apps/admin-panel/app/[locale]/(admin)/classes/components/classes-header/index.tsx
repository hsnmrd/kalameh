"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export interface ClassesHeaderProps {
  onAddClass: () => void
}

export function ClassesHeader({ onAddClass }: ClassesHeaderProps) {
  const t = useTranslations("classes")

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Button
        onClick={onAddClass}
        className="h-11 cursor-pointer gap-2 rounded-xl bg-primary px-5 font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        <Plus className="size-4" />
        <span>{t("addClass")}</span>
      </Button>
    </div>
  )
}
