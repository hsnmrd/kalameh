"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Building2, Check, CreditCard, Package, Phone } from "lucide-react"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import type { SupportedLocale } from "@workspace/types"
import type { InstituteFormTab } from "../institute-form-types"

interface InstituteStepNavigationProps {
  activeTab: InstituteFormTab
  onChange: (tab: InstituteFormTab) => void
}

const STEPS = [
  { id: "general", icon: Building2, label: "sectionGeneral", stepNumber: 1 },
  { id: "modules", icon: Package, label: "sectionModules", stepNumber: 2 },
  { id: "contact", icon: Phone, label: "sectionContact", stepNumber: 3 },
  { id: "banking", icon: CreditCard, label: "sectionBanking", stepNumber: 4 },
] as const

const STEP_ORDER: InstituteFormTab[] = [
  "general",
  "modules",
  "contact",
  "banking",
]

export function InstituteStepNavigation({
  activeTab,
  onChange,
}: InstituteStepNavigationProps) {
  const t = useTranslations("institutes")
  const locale = useLocale() as SupportedLocale
  const activeIndex = STEP_ORDER.indexOf(activeTab)

  return (
    <nav
      aria-label="Institute Setup Steps"
      className="w-full rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs sm:p-4"
    >
      <ol className="flex w-full items-center justify-between gap-1 sm:gap-2">
        {STEPS.map(({ id, icon: Icon, label, stepNumber }, index) => {
          const isCompleted = index < activeIndex
          const isActive = activeTab === id
          const isUpcoming = index > activeIndex

          return (
            <li
              key={id}
              className={cn(
                "flex flex-1 items-center",
                index === STEPS.length - 1 && "flex-initial"
              )}
            >
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "step" : undefined}
                className="group flex cursor-pointer items-center gap-2 transition-all focus-visible:outline-hidden sm:gap-3"
              >
                {/* Step Circle Badge */}
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 sm:size-11 sm:text-sm",
                    isCompleted &&
                      "bg-primary text-primary-foreground shadow-2xs",
                    isActive &&
                      "bg-primary text-primary-foreground shadow-xs ring-4 ring-primary/20",
                    isUpcoming &&
                      "border border-border/80 bg-muted/60 text-muted-foreground group-hover:border-foreground/30 group-hover:text-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check
                      className="size-4 stroke-[2.5] sm:size-5"
                      aria-hidden="true"
                    />
                  ) : (
                    <span>{formatNumber(stepNumber, locale)}</span>
                  )}
                </div>

                {/* Step Text / Info */}
                <div className="flex flex-col text-start">
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors sm:text-xs",
                      isActive
                        ? "font-bold text-foreground"
                        : isCompleted
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "me-1 inline-block size-3.5 -translate-y-px",
                        isActive
                          ? "text-primary"
                          : isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">
                      {t(`createModal.${label}`)}
                    </span>
                    <span className="sm:hidden">
                      {t(`createModal.${label}`)}
                    </span>
                  </span>
                </div>
              </button>

              {/* Connecting Horizontal Line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 sm:mx-3",
                    index < activeIndex ? "bg-primary" : "bg-muted"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
