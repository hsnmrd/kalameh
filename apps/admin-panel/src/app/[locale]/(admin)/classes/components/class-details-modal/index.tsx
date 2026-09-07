"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Edit2, GraduationCap, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  FormDialog,
  FormDialogCloseButton,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
} from "@workspace/ui/components/dialog"
import { PERMISSIONS, type ClassDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { Link } from "@/i18n/routing"
import { ClassSummary } from "./class-summary"
import { ScheduleOverview } from "./schedule-overview"

export interface ClassDetailsModalProps {
  cls: ClassDto | null
  open: boolean
  onClose: () => void
  onEdit?: (cls: ClassDto) => void
  onDelete?: (cls: ClassDto) => void
}

export function ClassDetailsModal({
  cls,
  open,
  onClose,
  onEdit,
  onDelete,
}: ClassDetailsModalProps) {
  const t = useTranslations("classes")
  const locale = useLocale()
  const [showAllDates, setShowAllDates] = React.useState(false)
  if (!cls) return null

  const enrolled = cls.enrolledCount ?? 0
  const capacity = cls.capacity
  const sortedDates = cls.sessionDates ? [...cls.sessionDates].sort() : []
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setShowAllDates(false)
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden"
                aria-label={t("detailsModal.title")}
              >
                <MoreVertical className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                drawerTitle={cls.title}
                className="min-w-48"
              >
                <PermissionGuard
                  permission={[
                    PERMISSIONS.VIEW_GRADES,
                    PERMISSIONS.MANAGE_GRADES,
                  ]}
                  mode="hide"
                >
                  <Link href={`/classes/${cls.id}/grades`}>
                    <DropdownMenuItem>
                      <GraduationCap className="size-4 text-muted-foreground" />
                      <span>{t("detailsModal.viewGrades")}</span>
                    </DropdownMenuItem>
                  </Link>
                </PermissionGuard>
                <PermissionGuard
                  permission={PERMISSIONS.MANAGE_CLASSES}
                  mode="hide"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      onClose()
                      onEdit?.(cls)
                    }}
                  >
                    <Edit2 className="size-4 text-muted-foreground" />
                    <span>{t("detailsModal.editClass")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      onClose()
                      onDelete?.(cls)
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                    <span>{t("detailsModal.deleteClass")}</span>
                  </DropdownMenuItem>
                </PermissionGuard>
              </DropdownMenuContent>
            </DropdownMenu>
            <FormDialogTitle>{t("detailsModal.title")}</FormDialogTitle>
          </div>
          <FormDialogCloseButton />
        </FormDialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <ClassSummary
            cls={cls}
            locale={locale}
            enrolled={enrolled}
            capacity={capacity}
            fillPercent={
              capacity > 0
                ? Math.min(100, Math.round((enrolled / capacity) * 100))
                : 0
            }
            isFull={enrolled >= capacity}
          />
          <ScheduleOverview
            cls={cls}
            locale={locale}
            sortedDates={sortedDates}
            showAllDates={showAllDates}
            onToggleDates={() => setShowAllDates((value) => !value)}
          />
        </div>
        <FormDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 min-w-28 rounded-xl text-sm font-medium"
          >
            {t("detailsModal.close")}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
