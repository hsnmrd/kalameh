"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import { PermissionGuard } from "@/components/permission-guard"

export interface BooksFilterProps {
  search: string
  onSearchChange: (search: string) => void
  onAddClick?: () => void
}

export function BooksFilter({
  search,
  onSearchChange,
  onAddClick,
}: BooksFilterProps) {
  const t = useTranslations("books")

  return (
    <AdminFilterBar
      search={
        <AdminSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder")}
        />
      }
      actions={
        onAddClick ? (
          <PermissionGuard permission={PERMISSIONS.MANAGE_BOOKS} mode="hide">
            <Button
              type="button"
              onClick={onAddClick}
              className="hidden h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs lg:inline-flex"
            >
              <Plus className="size-5" />
              <span>{t("addBook")}</span>
            </Button>
          </PermissionGuard>
        ) : null
      }
    />
  )
}
