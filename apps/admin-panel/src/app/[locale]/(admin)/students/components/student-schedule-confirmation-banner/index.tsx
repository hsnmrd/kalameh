"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, AlertTriangle, ChevronDown } from "lucide-react"
import { PERMISSIONS, type TermDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import { cn } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"

export interface StudentScheduleConfirmationBannerProps {
  term: TermDto
  onConfirmClick: () => void
  className?: string
  hasStudents?: boolean
  studentsCount?: number
}

export function StudentScheduleConfirmationBanner({
  term,
  onConfirmClick,
  className,
  hasStudents,
  studentsCount,
}: StudentScheduleConfirmationBannerProps) {
  const t = useTranslations("students.confirmStudentSchedules")
  const [isOpen, setIsOpen] = React.useState(false)

  if (Boolean(term.studentSchedulesConfirmedAt)) return null
  if (hasStudents === false || studentsCount === 0) return null
  if (term.isActive === false) return null
  if (
    term.lifecycleStatus === "COMPLETED" ||
    term.lifecycleStatus === "INACTIVE"
  ) {
    return null
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "rounded-2xl border border-warning/30 bg-warning/5 p-3 text-foreground sm:p-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <AlertTriangle className="size-5 shrink-0 text-warning" />
          <CollapsibleTrigger
            type="button"
            className="group flex min-w-0 cursor-pointer items-center gap-1.5 text-start font-semibold text-foreground transition-colors hover:text-foreground/80"
          >
            <span className="truncate text-xs font-semibold sm:text-sm">
              {t("bannerTitle")}
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
                isOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
        </div>

        <PermissionGuard
          permission={PERMISSIONS.APPROVE_STUDENTS_TIME}
          mode="hide"
        >
          <Button
            type="button"
            size="sm"
            onClick={onConfirmClick}
            className="h-8 shrink-0 gap-1.5 px-3 text-xs font-medium"
          >
            <Clock className="size-3.5" />
            <span>{t("confirm")}</span>
          </Button>
        </PermissionGuard>
      </div>

      <CollapsibleContent>
        <div className="mt-2.5 border-t border-warning/20 pt-2.5 text-xs leading-relaxed text-muted-foreground">
          <p>{t("bannerDescription", { termTitle: term.title })}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
