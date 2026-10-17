"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Award, ChevronDown } from "lucide-react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@workspace/ui/components/collapsible"
import { cn } from "@workspace/ui/lib/utils"

export interface StudentLevelHeaderProps {
  allowedCourseTitle?: string
  defaultOpen?: boolean
  className?: string
}

export function StudentLevelHeader({
  allowedCourseTitle,
  defaultOpen = false,
  className,
}: StudentLevelHeaderProps) {
  const t = useTranslations("classes")
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const title = allowedCourseTitle
    ? t("allowedLevel", { level: allowedCourseTitle })
    : t("noLevelAssigned")

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "rounded-2xl border border-primary/20 bg-primary/5 p-3.5 transition-all sm:p-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <CollapsibleTrigger
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-start focus-visible:outline-hidden"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Award className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-foreground sm:text-sm">
              {title}
            </span>
          </div>
        </CollapsibleTrigger>

        <CollapsibleTrigger
          type="button"
          aria-label={isOpen ? t("collapseDetails") : t("expandDetails")}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-hidden"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="mt-2.5 border-t border-primary/15 pt-2.5 text-xs leading-relaxed text-muted-foreground">
        <p>{t("allowedLevelDesc")}</p>
      </CollapsibleContent>
    </Collapsible>
  )
}
