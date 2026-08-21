"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus, Users } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export interface UsersHeaderProps {
  totalCount: number
  onAddUserClick: () => void
}

export function UsersHeader({ totalCount, onAddUserClick }: UsersHeaderProps) {
  const t = useTranslations("users")

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold text-slate-900">
            {t("title")}
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            <Users className="size-3" />
            {totalCount}
          </span>
        </div>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <Button
        onClick={onAddUserClick}
        className="h-10 cursor-pointer gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
      >
        <Plus className="size-4" />
        <span>{t("addUser")}</span>
      </Button>
    </div>
  )
}
