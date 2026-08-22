"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { User, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Price } from "@workspace/ui/components/price"
import type { ClassDto } from "@workspace/types"

export interface StudentClassCardProps {
  cls: ClassDto
  onEnroll?: (cls: ClassDto) => void
}

export function StudentClassCard({ cls, onEnroll }: StudentClassCardProps) {
  const t = useTranslations("classes")
  const locale = useLocale()

  const enrolled = cls.enrolledCount ?? 0
  const isFull = enrolled >= cls.capacity

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {cls.term?.title}
        </span>
        <Badge
          variant="outline"
          className={
            isFull
              ? "border-rose-500/20 bg-rose-500/10 text-rose-600"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
          }
        >
          {isFull ? (
            t("full")
          ) : (
            <span className="font-mono">
              {enrolled} / {cls.capacity}
            </span>
          )}
        </Badge>
      </div>

      <div>
        <h2 className="text-base font-bold text-foreground">{cls.title}</h2>
        {cls.teacherName && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/80">
            <User className="size-3.5 text-muted-foreground" />
            <span>
              {t("teacher")}: {cls.teacherName}
            </span>
          </p>
        )}
        {cls.schedule && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/80">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>{cls.schedule}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-3">
        <div>
          <span className="block text-[11px] text-muted-foreground">
            {t("tuition")}
          </span>
          <Price
            amount={cls.fee}
            locale={locale}
            className="text-sm font-bold text-foreground"
          />
        </div>

        <Button
          onClick={() => onEnroll?.(cls)}
          disabled={isFull}
          className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 disabled:opacity-50"
        >
          <CheckCircle2 className="me-1.5 size-4" />
          <span>{t("enrollButton")}</span>
        </Button>
      </div>
    </div>
  )
}
