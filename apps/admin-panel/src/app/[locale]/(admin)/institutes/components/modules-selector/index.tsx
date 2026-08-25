"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Users,
  GraduationCap,
  Layers,
  Award,
  CreditCard,
  CalendarCheck,
  MessageSquare,
  Video,
  Check,
  Package,
} from "lucide-react"
import { APP_MODULES, ALL_APP_MODULES, type AppModule } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export interface ModulesSelectorProps {
  value: string[]
  onChange: (modules: string[]) => void
}

const MODULE_ICONS: Record<
  AppModule,
  React.ComponentType<{ className?: string }>
> = {
  [APP_MODULES.USERS_STAFF]: Users,
  [APP_MODULES.STUDENTS]: GraduationCap,
  [APP_MODULES.CLASSES_COURSES]: Layers,
  [APP_MODULES.GRADES_ASSESSMENTS]: Award,
  [APP_MODULES.FINANCE]: CreditCard,
  [APP_MODULES.ATTENDANCE]: CalendarCheck,
  [APP_MODULES.SMS_NOTIFICATIONS]: MessageSquare,
  [APP_MODULES.ONLINE_ROOMS]: Video,
}

const PRESET_STARTER: AppModule[] = [
  APP_MODULES.USERS_STAFF,
  APP_MODULES.STUDENTS,
  APP_MODULES.CLASSES_COURSES,
]

const PRESET_PRO: AppModule[] = [
  APP_MODULES.USERS_STAFF,
  APP_MODULES.STUDENTS,
  APP_MODULES.CLASSES_COURSES,
  APP_MODULES.GRADES_ASSESSMENTS,
  APP_MODULES.ATTENDANCE,
  APP_MODULES.SMS_NOTIFICATIONS,
]

export function ModulesSelector({
  value = [],
  onChange,
}: ModulesSelectorProps) {
  const t = useTranslations("institutes.modules")

  const handleToggle = (module: AppModule) => {
    if (value.includes(module)) {
      onChange(value.filter((m) => m !== module))
    } else {
      onChange([...value, module])
    }
  }

  const applyPreset = (preset: readonly AppModule[]) => {
    onChange([...preset])
  }

  return (
    <div className="space-y-4">
      {/* Presets Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/40 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Package className="size-4 text-muted-foreground" />
          <span>{t("presetsTitle")}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset(PRESET_STARTER)}
            className="h-7.5 cursor-pointer rounded-lg px-2.5 text-xs font-medium"
          >
            {t("presetStarter")}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset(PRESET_PRO)}
            className="h-7.5 cursor-pointer rounded-lg px-2.5 text-xs font-medium"
          >
            {t("presetPro")}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset(ALL_APP_MODULES)}
            className="h-7.5 cursor-pointer rounded-lg px-2.5 text-xs font-medium"
          >
            {t("presetEnterprise")}
          </Button>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {ALL_APP_MODULES.map((moduleKey) => {
          const isSelected = value.includes(moduleKey)
          const Icon = MODULE_ICONS[moduleKey] || Package

          return (
            <button
              key={moduleKey}
              type="button"
              onClick={() => handleToggle(moduleKey)}
              className={cn(
                "group relative flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-start transition-all",
                isSelected
                  ? "border-emerald-500/60 bg-emerald-500/5 shadow-2xs"
                  : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  isSelected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "border-border/60 bg-muted/60 text-muted-foreground group-hover:text-foreground"
                )}
              >
                <Icon className="size-4.5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="line-clamp-1 text-xs font-bold text-foreground">
                    {t(`items.${moduleKey}.name`)}
                  </h4>

                  {isSelected && (
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="size-2.5" />
                    </span>
                  )}
                </div>

                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                  {t(`items.${moduleKey}.description`)}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
