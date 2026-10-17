"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarCheck, Clock, Bookmark, ChevronDown } from "lucide-react"
import {
  findClosestSignupTerm,
  type TermDto,
  type TermLifecycleSettings,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@workspace/ui/components/collapsible"
import { cn } from "@workspace/ui/lib/utils"

export interface ClosestTermSignupBannerProps {
  terms: TermDto[]
  instituteSettings?: TermLifecycleSettings
  defaultOpen?: boolean
  className?: string
}

export function ClosestTermSignupBanner({
  terms,
  instituteSettings,
  defaultOpen = false,
  className,
}: ClosestTermSignupBannerProps) {
  const t = useTranslations("students.closestTerm")
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const closest = React.useMemo(() => {
    return findClosestSignupTerm(terms, instituteSettings)
  }, [terms, instituteSettings])

  if (!terms || terms.length === 0) {
    return null
  }

  const { term, isRegistrationOpen, daysUntilEndRegistration } = closest

  if (isRegistrationOpen && term) {
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn(
          "rounded-2xl border border-primary/30 bg-primary/5 p-3 text-foreground shadow-xs transition-all sm:p-4",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:items-start sm:gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-10 sm:rounded-xl">
              <CalendarCheck className="size-4 sm:size-5" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <CollapsibleTrigger
                  type="button"
                  className="group flex min-w-0 cursor-pointer items-center gap-1 text-start font-semibold text-foreground transition-colors hover:text-foreground/80 sm:pointer-events-none"
                >
                  <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
                    {t("registeringTitle", { termTitle: term.title })}
                  </span>
                </CollapsibleTrigger>
                <Badge
                  variant="outline"
                  className="shrink-0 border-primary/40 bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary sm:px-2 sm:py-0.5 sm:text-xs"
                >
                  {t("badgeRegistering")}
                </Badge>
              </div>

              <p className="hidden text-xs text-muted-foreground sm:mt-1 sm:block">
                {t("registeringSubtitle", {
                  termTitle: term.title,
                  days: daysUntilEndRegistration ?? 0,
                })}
              </p>
            </div>
          </div>

          <CollapsibleTrigger
            type="button"
            aria-label={isOpen ? t("collapseDetails") : t("expandDetails")}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-hidden sm:hidden"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-250",
                isOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="sm:hidden">
          <div className="mt-2.5 border-t border-primary/20 pt-2.5 text-xs leading-relaxed text-muted-foreground">
            <p>
              {t("registeringSubtitle", {
                termTitle: term.title,
                days: daysUntilEndRegistration ?? 0,
              })}
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  if (term) {
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn(
          "rounded-2xl border border-warning/30 bg-warning/5 p-3 text-foreground shadow-xs transition-all sm:p-4",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:items-start sm:gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning sm:size-10 sm:rounded-xl">
              <Clock className="size-4 sm:size-5" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <CollapsibleTrigger
                  type="button"
                  className="group flex min-w-0 cursor-pointer items-center gap-1 text-start font-semibold text-foreground transition-colors hover:text-foreground/80 sm:pointer-events-none"
                >
                  <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
                    {t("wishlistTitle", { nextTermTitle: term.title })}
                  </span>
                </CollapsibleTrigger>
                <Badge
                  variant="outline"
                  className="shrink-0 border-warning/40 bg-warning/15 px-1.5 py-0 text-[10px] font-medium text-warning sm:px-2 sm:py-0.5 sm:text-xs"
                >
                  <Bookmark className="me-1 size-2.5 sm:size-3" />
                  {t("badgeWishlist")}
                </Badge>
              </div>

              <p className="hidden text-xs text-muted-foreground sm:mt-1 sm:block">
                {t("wishlistSubtitle", { nextTermTitle: term.title })}
              </p>
            </div>
          </div>

          <CollapsibleTrigger
            type="button"
            aria-label={isOpen ? t("collapseDetails") : t("expandDetails")}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-warning/15 hover:text-warning focus-visible:outline-hidden sm:hidden"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-250",
                isOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="sm:hidden">
          <div className="mt-2.5 border-t border-warning/20 pt-2.5 text-xs leading-relaxed text-muted-foreground">
            <p>{t("wishlistSubtitle", { nextTermTitle: term.title })}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "rounded-2xl border border-border/60 bg-muted/20 p-3 text-foreground shadow-xs transition-all sm:p-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:items-start sm:gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:size-9 sm:rounded-xl">
            <Clock className="size-4" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <CollapsibleTrigger
              type="button"
              className="group flex min-w-0 cursor-pointer items-center gap-1 text-start font-semibold text-foreground transition-colors hover:text-foreground/80 sm:pointer-events-none"
            >
              <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
                {t("noTermTitle")}
              </span>
            </CollapsibleTrigger>

            <p className="hidden text-xs text-muted-foreground sm:mt-1 sm:block">
              {t("noTermSubtitle")}
            </p>
          </div>
        </div>

        <CollapsibleTrigger
          type="button"
          aria-label={isOpen ? t("collapseDetails") : t("expandDetails")}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden sm:hidden"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-250",
              isOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="sm:hidden">
        <div className="mt-2.5 border-t border-border/40 pt-2.5 text-xs leading-relaxed text-muted-foreground">
          <p>{t("noTermSubtitle")}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
