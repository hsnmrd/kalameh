"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { User, Clock, CheckCircle2, UserPlus } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Price } from "@workspace/ui/components/price"
import { Spinner } from "@workspace/ui/components/spinner"
import type { ClassDto } from "@workspace/types"

export interface StudentClassCardProps {
  cls: ClassDto
  onEnroll?: (cls: ClassDto) => void
  onWaitlist?: (cls: ClassDto) => void
  isPending?: boolean
}

export function StudentClassCard({
  cls,
  onEnroll,
  onWaitlist,
  isPending,
}: StudentClassCardProps) {
  const t = useTranslations("classes")
  const locale = useLocale()

  const enrolled = cls.enrolledCount ?? 0
  const isFull = enrolled >= cls.capacity

  return (
    <div className="flex flex-col gap-4 border-b border-border/60 pt-1 pb-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {cls.term?.title}
        </span>
        <Badge
          variant="outline"
          className={
            isFull
              ? "border-destructive/20 bg-destructive/10 text-destructive"
              : "border-success/20 bg-success/10 text-success"
          }
        >
          {isFull ? (
            t("full")
          ) : (
            <span>
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

      <div className="flex items-center justify-between border-t border-border/40 pt-3">
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

        {isFull ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => onWaitlist?.(cls)}
            disabled={isPending}
            className="h-10 cursor-pointer rounded-xl border-border px-4 text-xs font-semibold text-foreground hover:bg-muted"
          >
            {isPending ? (
              <Spinner className="me-1.5 size-4" />
            ) : (
              <UserPlus className="me-1.5 size-4 text-muted-foreground" />
            )}
            <span>{t("waitlistButton")}</span>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => onEnroll?.(cls)}
            disabled={isPending}
            className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <Spinner className="me-1.5 size-4" />
            ) : (
              <CheckCircle2 className="me-1.5 size-4" />
            )}
            <span>{t("enrollButton")}</span>
          </Button>
        )}
      </div>
    </div>
  )
}
