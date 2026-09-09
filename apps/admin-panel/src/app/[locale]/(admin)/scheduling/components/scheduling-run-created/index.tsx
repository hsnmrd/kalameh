"use client"

import { useTranslations } from "next-intl"
import { Check, RotateCcw } from "lucide-react"
import type { SchedulingRunDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

interface SchedulingRunCreatedProps {
  run: SchedulingRunDto
  onReset: () => void
}

export function SchedulingRunCreated({
  run,
  onReset,
}: SchedulingRunCreatedProps) {
  const t = useTranslations("scheduling.generation.created")

  return (
    <section className="flex min-h-72 flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-card px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check aria-hidden className="size-6" />
      </span>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <h2 className="text-lg font-bold text-foreground">{t("title")}</h2>
          <Badge variant="secondary">{t(`statuses.${run.status}`)}</Badge>
        </div>
        <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <div className="rounded-xl bg-muted px-4 py-2 text-xs text-muted-foreground">
        {t("runId", { id: run.id })}
      </div>
      <Button type="button" variant="outline" size="lg" onClick={onReset}>
        <RotateCcw aria-hidden data-icon="inline-start" />
        {t("another")}
      </Button>
    </section>
  )
}
