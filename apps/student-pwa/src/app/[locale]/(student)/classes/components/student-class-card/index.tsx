"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { User, Clock, CheckCircle2, UserPlus, CreditCard } from "lucide-react"
import { Link } from "@/i18n/routing"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Price } from "@workspace/ui/components/price"
import { Spinner } from "@workspace/ui/components/spinner"
import { ENROLLMENT_STATUSES, type ClassDto } from "@workspace/types"

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
  const status = cls.studentEnrollmentStatus

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

        {status === ENROLLMENT_STATUSES.ENROLLED ? (
          <Button
            render={<Link href="/enrollments" />}
            variant="outline"
            size="md"
            className="cursor-pointer border-success/30 bg-success/10 px-4 text-xs font-semibold text-success hover:bg-success/20"
          >
            <CheckCircle2 className="me-1.5 size-4 text-success" />
            <span>{t("statusEnrolled")}</span>
          </Button>
        ) : status === ENROLLMENT_STATUSES.PENDING_APPROVAL ? (
          <Button
            render={<Link href="/enrollments" />}
            variant="outline"
            size="md"
            className="cursor-pointer border-warning/30 bg-warning/10 px-4 text-xs font-semibold text-warning hover:bg-warning/20"
          >
            <Clock className="me-1.5 size-4 text-warning" />
            <span>{t("statusPendingApproval")}</span>
          </Button>
        ) : status === ENROLLMENT_STATUSES.PENDING_PAYMENT ? (
          <Button
            render={<Link href={`/enrollments?classId=${cls.id}`} />}
            size="md"
            className="cursor-pointer bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <CreditCard className="me-1.5 size-4" />
            <span>{t("completePayment")}</span>
          </Button>
        ) : status === ENROLLMENT_STATUSES.WAITLISTED ? (
          <Button
            render={<Link href="/enrollments" />}
            variant="outline"
            size="md"
            className="cursor-pointer border-border px-4 text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            <UserPlus className="me-1.5 size-4 text-muted-foreground" />
            <span>{t("statusWaitlisted")}</span>
          </Button>
        ) : isFull ? (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => onWaitlist?.(cls)}
            disabled={isPending}
            className="cursor-pointer border-border px-4 text-xs font-semibold text-foreground hover:bg-muted"
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
            size="md"
            onClick={() => onEnroll?.(cls)}
            disabled={isPending}
            className="cursor-pointer bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
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
