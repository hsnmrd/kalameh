"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Building2, Check, CreditCard, Package, Phone } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
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
  const [api, setApi] = React.useState<CarouselApi>()
  const activeIndex = STEP_ORDER.indexOf(activeTab)

  React.useEffect(() => {
    if (!api) return
    api.scrollTo(activeIndex)
  }, [api, activeIndex])

  return (
    <nav
      aria-label="Institute Setup Steps"
      className="w-full overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-2.5 shadow-2xs sm:p-3"
    >
      <Carousel
        setApi={setApi}
        opts={{ align: "start", dragFree: true }}
        className="w-full"
      >
        <CarouselContent className="-ms-2.5">
          {STEPS.map(({ id, icon: Icon, label, stepNumber }, index) => {
            const isCompleted = index < activeIndex
            const isActive = activeTab === id
            const isUpcoming = index > activeIndex

            return (
              <CarouselItem
                key={id}
                className="min-w-0 shrink-0 basis-[60%] ps-2.5 sm:basis-[48%]"
              >
                <button
                  type="button"
                  onClick={() => onChange(id)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "group flex h-full min-h-[58px] w-full cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-start transition-all focus-visible:outline-hidden",
                    isActive
                      ? "border-primary/80 bg-primary/10 shadow-2xs ring-1 ring-primary/30"
                      : isCompleted
                        ? "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30"
                        : "border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:bg-muted/20"
                  )}
                >
                  {/* Step Circle Badge */}
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs ring-4 ring-primary/20"
                        : isCompleted
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "border border-border/80 bg-muted/60 text-muted-foreground group-hover:border-foreground/30 group-hover:text-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check
                        className="size-4.5 stroke-[2.5]"
                        aria-hidden="true"
                      />
                    ) : (
                      <span>{formatNumber(stepNumber, locale)}</span>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive
                            ? "text-primary"
                            : isCompleted
                              ? "text-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className={cn(
                          "truncate text-xs font-semibold transition-colors sm:text-sm",
                          isActive
                            ? "font-bold text-foreground"
                            : isCompleted
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {t(`createModal.${label}`)}
                      </span>
                    </div>
                  </div>
                </button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </nav>
  )
}
