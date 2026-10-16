"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
import type { CourseNamingFormat } from "@workspace/types"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@workspace/ui/components/collapsible"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export interface NamingFormatCollapsibleProps {
  namingFormat: CourseNamingFormat
  onFormatChange: (format: CourseNamingFormat) => void
}

export function NamingFormatCollapsible({
  namingFormat,
  onFormatChange,
}: NamingFormatCollapsibleProps) {
  const t = useTranslations("books")
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-muted/20 p-3"
    >
      <CollapsibleTrigger
        type="button"
        className="flex w-full cursor-pointer items-center justify-between text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
          <span>{t("generateCoursesModal.namingFormat")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="px-1.5 py-0 text-[10px] font-normal"
          >
            {namingFormat === "TERM" ? "Term" : "Part"}
          </Badge>
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-2 gap-2 pt-2.5">
          <Button
            type="button"
            variant={namingFormat === "PART" ? "default" : "outline"}
            onClick={() => onFormatChange("PART")}
            className="h-14 rounded-2xl text-sm font-medium"
          >
            Part
          </Button>
          <Button
            type="button"
            variant={namingFormat === "TERM" ? "default" : "outline"}
            onClick={() => onFormatChange("TERM")}
            className="h-14 rounded-2xl text-sm font-medium"
          >
            Term
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
