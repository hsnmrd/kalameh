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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <Button
        onClick={onAddClass}
        className="h-11 cursor-pointer gap-2 rounded-xl bg-slate-900 px-5 font-medium text-white shadow-sm hover:bg-slate-800"
      >
        <Plus className="size-4" />
        <span>{t("addClass")}</span>
      </Button>
    </div>
  )
}
