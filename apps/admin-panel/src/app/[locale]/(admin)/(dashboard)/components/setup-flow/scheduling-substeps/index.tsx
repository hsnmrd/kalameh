"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, ArrowLeft, ArrowRight, ArrowDown } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Link, useIsRtl } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import type { SetupSubstep } from "../types"

export interface SchedulingSubstepsProps {
  substeps: SetupSubstep[]
}

export function SchedulingSubsteps({ substeps }: SchedulingSubstepsProps) {
  const t = useTranslations("dashboard.instituteAdmin.setupFlow")
  const isRtl = useIsRtl()
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  return (
    <div className="mt-3 flex flex-col gap-2.5 rounded-xl border border-border/80 bg-muted/40 p-4">
      <div className="text-xs font-bold text-foreground">
        {t("steps.scheduling.substepsTitle")}
      </div>

      <div className="flex flex-col gap-2">
        {substeps.map((substep, index) => {
          const isDone = substep.isDone
          const title = t(`steps.scheduling.${substep.titleKey}.title`)
          const desc = t(`steps.scheduling.${substep.descKey}.description`)

          return (
            <React.Fragment key={substep.id}>
              {index > 0 && (
                <div className="flex justify-center py-0.5 text-muted-foreground/60">
                  <ArrowDown className="size-3" />
                </div>
              )}
              <div
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
                  isDone
                    ? "border-success/30 bg-success/5"
                    : "border-border/70 bg-card/60"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      isDone
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isDone ? <Check className="size-3" /> : index + 1}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Badge
                    variant={isDone ? "success" : "secondary"}
                    className="text-[10px]"
                  >
                    {isDone ? t("status.completed") : t("status.pending")}
                  </Badge>

                  <Link href={substep.href}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 cursor-pointer gap-1 rounded-lg px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <span>{t("actions.view")}</span>
                      <ActionArrow className="size-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
