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
  Sparkles,
  Building2,
  Crown,
} from "lucide-react"
import { APP_MODULES, ALL_APP_MODULES, type AppModule } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { cn } from "@workspace/ui/lib/utils"

export interface ModulesSelectorProps {
  value: string[]
  onChange: (modules: string[]) => void
}

const MODULE_ICONS: Record<
  AppModule,
  React.ComponentType<{
    className?: string
    "aria-hidden"?: boolean | "true" | "false"
  }>
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

  const isStarterActive =
    value.length === PRESET_STARTER.length &&
    PRESET_STARTER.every((m) => value.includes(m))

  const isProActive =
    value.length === PRESET_PRO.length &&
    PRESET_PRO.every((m) => value.includes(m))

  const isEnterpriseActive =
    value.length === ALL_APP_MODULES.length &&
    ALL_APP_MODULES.every((m) => value.includes(m))

  return (
    <div className="flex w-full flex-col gap-5">
      {/* 3 Suggest/Preset Buttons in Horizontal Order */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Package
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span>{t("presetsTitle")}</span>
        </div>

        <div className="grid w-full grid-cols-3 gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => applyPreset(PRESET_STARTER)}
            className={cn(
              "h-14 cursor-pointer rounded-2xl px-2 font-medium transition-all sm:px-4",
              isStarterActive
                ? "border-primary bg-primary/10 font-semibold text-primary ring-1 ring-primary/30"
                : "border-border/80 bg-card text-foreground hover:bg-muted/40"
            )}
          >
            <Sparkles
              className="size-4 shrink-0 text-inherit sm:size-4.5"
              aria-hidden="true"
            />
            <span className="truncate text-xs sm:text-sm">
              {t("presetStarter")}
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => applyPreset(PRESET_PRO)}
            className={cn(
              "h-14 cursor-pointer rounded-2xl px-2 font-medium transition-all sm:px-4",
              isProActive
                ? "border-primary bg-primary/10 font-semibold text-primary ring-1 ring-primary/30"
                : "border-border/80 bg-card text-foreground hover:bg-muted/40"
            )}
          >
            <Crown
              className="size-4 shrink-0 text-inherit sm:size-4.5"
              aria-hidden="true"
            />
            <span className="truncate text-xs sm:text-sm">
              {t("presetPro")}
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => applyPreset(ALL_APP_MODULES)}
            className={cn(
              "h-14 cursor-pointer rounded-2xl px-2 font-medium transition-all sm:px-4",
              isEnterpriseActive
                ? "border-primary bg-primary/10 font-semibold text-primary ring-1 ring-primary/30"
                : "border-border/80 bg-card text-foreground hover:bg-muted/40"
            )}
          >
            <Building2
              className="size-4 shrink-0 text-inherit sm:size-4.5"
              aria-hidden="true"
            />
            <span className="truncate text-xs sm:text-sm">
              {t("presetEnterprise")}
            </span>
          </Button>
        </div>
      </div>

      {/* Modules Carousel (Same Width as the 3 Buttons) */}
      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {t("title")}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CarouselPrevious
              className="static size-8 translate-x-0 translate-y-0 scale-100 rounded-xl border-border/80 bg-muted/40 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
              aria-label="Previous modules"
            />
            <CarouselNext
              className="static size-8 translate-x-0 translate-y-0 scale-100 rounded-xl border-border/80 bg-muted/40 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
              aria-label="Next modules"
            />
          </div>
        </div>

        <CarouselContent className="items-stretch">
          {ALL_APP_MODULES.map((moduleKey) => {
            const isSelected = value.includes(moduleKey)
            const Icon = MODULE_ICONS[moduleKey] || Package

            return (
              <CarouselItem
                key={moduleKey}
                className="flex shrink-0 basis-[260px] sm:basis-[280px]"
              >
                <Button
                  key={moduleKey}
                  type="button"
                  variant="ghost"
                  onClick={() => handleToggle(moduleKey)}
                  className={cn(
                    "group relative flex h-full min-h-[140px] w-full cursor-pointer flex-col items-start justify-between rounded-2xl border p-4 text-start font-normal transition-all",
                    isSelected
                      ? "border-success/60 bg-success/5 shadow-2xs hover:bg-success/10"
                      : "border-border/80 bg-card hover:border-border hover:bg-muted/30"
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                        isSelected
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-border/60 bg-muted/60 text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </div>

                    {isSelected && (
                      <div className="flex size-5 items-center justify-center rounded-full bg-success text-success-foreground shadow-2xs">
                        <Check
                          className="size-3.5 stroke-[2.5]"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex w-full flex-col gap-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {t(`items.${moduleKey}.name`)}
                    </p>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {t(`items.${moduleKey}.description`)}
                    </p>
                  </div>
                </Button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
