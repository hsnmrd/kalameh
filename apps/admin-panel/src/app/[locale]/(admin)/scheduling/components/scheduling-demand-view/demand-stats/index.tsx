import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  UserCheck,
  Users,
} from "lucide-react"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface DemandStatsProps {
  totalStudents: number
  passedStudents: number
  placementStudents: number
  suggestedClasses: number
  registeredClasses?: number
}

export function DemandStats({
  totalStudents,
  passedStudents,
  placementStudents,
  suggestedClasses,
  registeredClasses = 0,
}: DemandStatsProps) {
  const t = useTranslations("scheduling.demand.stats")
  const locale = useLocale()

  const items = [
    {
      key: "totalStudents",
      label: t("totalStudents"),
      value: totalStudents,
      icon: Users,
    },
    {
      key: "passedStudents",
      label: t("passedStudents"),
      value: passedStudents,
      icon: GraduationCap,
    },
    {
      key: "placementStudents",
      label: t("placementStudents"),
      value: placementStudents,
      icon: UserCheck,
    },
    {
      key: "suggestedClasses",
      label: t("suggestedClasses"),
      value: suggestedClasses,
      icon: BookOpen,
    },
    {
      key: "registeredClasses",
      label: t("registeredClasses"),
      value: registeredClasses,
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
      {items.map(({ key, label, value, icon: Icon }) => (
        <div
          key={key}
          className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-2xs"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs text-muted-foreground">
              {label}
            </span>
            <span className="text-xl font-bold tracking-tight text-foreground">
              {formatNumber(value, locale)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
