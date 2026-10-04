"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarClock, ChevronDown, Plus } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@workspace/ui/components/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Link, useRouter } from "@/i18n/routing"
import { PermissionGuard } from "@/components/permission-guard"

export interface ClassesActionButtonProps {
  onAddClick?: () => void
}

export function ClassesActionButton({ onAddClick }: ClassesActionButtonProps) {
  const t = useTranslations("classes")
  const router = useRouter()

  return (
    <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
      <ButtonGroup className="shadow-xs">
        {/* Primary Action: Smart Scheduling (Direct Click) */}
        <Button
          render={<Link href="/classes/scheduling" />}
          className="h-14 cursor-pointer gap-2 rounded-s-2xl px-5 text-sm font-semibold"
        >
          <CalendarClock className="size-5" />
          <span>{t("scheduling")}</span>
        </Button>

        {/* Separator between action buttons */}
        {onAddClick && (
          <ButtonGroupSeparator className="my-3 bg-primary-foreground/25" />
        )}

        {/* Action Dropdown for Additional Options (e.g. Manual Class Creation) */}
        {onAddClick && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  className="h-14 w-12 cursor-pointer px-0"
                  aria-label={t("actions")}
                />
              }
            >
              <ChevronDown className="size-5 text-primary-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-56 p-1.5">
              <DropdownMenuItem
                onClick={() => router.push("/classes/scheduling")}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold"
              >
                <CalendarClock className="size-4.5" />
                <span>{t("scheduling")}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onAddClick}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-semibold"
              >
                <Plus className="size-4.5" />
                <span>{t("manualAdd")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </ButtonGroup>
    </PermissionGuard>
  )
}
