"use client"

import * as React from "react"
import { Link } from "@/i18n/routing"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { ReceiptText, Layers } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyContent,
} from "@workspace/ui/components/empty"
import { ENROLLMENT_STATUSES } from "@workspace/types"
import {
  enrollmentsResource,
  institutesResource,
  transactionsResource,
} from "@/lib/api"
import { ReservationTimer } from "./components/reservation-timer"
import { BankInfoCard } from "./components/bank-info-card"
import { UploadReceiptCard } from "./components/upload-receipt-card"
import { ReceiptStatusCard } from "./components/receipt-status-card"

export default function StudentEnrollmentsPage() {
  const t = useTranslations("enrollments")
  const queryClient = useQueryClient()

  const {
    data: enrollments,
    isLoading: isEnrollmentsLoading,
    refetch: refetchEnrollments,
  } = useQuery(enrollmentsResource.my.toQuery())

  const { data: bankInfo } = useQuery(institutesResource.bankInfo.toQuery())

  const submitReceiptMutation = useMutation({
    ...transactionsResource.submit.toMutation(),
    onSuccess: () => {
      toast.success(t("upload.submitSuccess"))
      void queryClient.invalidateQueries({
        queryKey: enrollmentsResource.my.baseKey(),
      })
    },
  })

  const cancelReservationMutation = useMutation({
    ...enrollmentsResource.cancelReservation.toMutation(),
    onSuccess: () => {
      toast.success(t("upload.cancelSuccess"))
      void queryClient.invalidateQueries({
        queryKey: enrollmentsResource.my.baseKey(),
      })
    },
  })

  if (isEnrollmentsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  // Active reservation (status = PENDING_PAYMENT)
  const activeReservation = enrollments?.find(
    (e) => e.status === ENROLLMENT_STATUSES.PENDING_PAYMENT
  )

  // Other enrollments
  const otherEnrollments =
    enrollments?.filter(
      (e) => e.status !== ENROLLMENT_STATUSES.PENDING_PAYMENT
    ) ?? []

  const handleSubmitReceipt = ({
    trackingCode,
    file,
  }: {
    trackingCode: string
    file: File
  }) => {
    if (!activeReservation?.class) return

    const formData = new FormData()
    formData.append("receipt", file)
    formData.append("amount", String(activeReservation.class.fee))
    formData.append("trackingCode", trackingCode)
    formData.append("classId", activeReservation.class.id)

    submitReceiptMutation.mutate(formData)
  }

  const handleCancelReservation = () => {
    if (!activeReservation?.classId) return
    cancelReservationMutation.mutate(activeReservation.classId)
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col gap-1 border-b border-border/60 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Active Reservation Section */}
      {activeReservation?.class && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-foreground">
            {t("activeReservationTitle")}: {activeReservation.class.title}
          </h2>

          <ReservationTimer
            initialSeconds={
              activeReservation.remainingReservationSeconds ?? 1800
            }
            onExpire={() => {
              void refetchEnrollments()
            }}
          />

          <BankInfoCard
            bankInfo={bankInfo}
            tuition={activeReservation.class.fee}
          />

          <UploadReceiptCard
            classId={activeReservation.class.id}
            tuition={activeReservation.class.fee}
            onSubmitReceipt={handleSubmitReceipt}
            onCancelReservation={handleCancelReservation}
            isSubmitting={submitReceiptMutation.isPending}
            isCancelling={cancelReservationMutation.isPending}
          />
        </div>
      )}

      {/* Other Enrollments / History */}
      {otherEnrollments.length > 0 && (
        <div className="flex flex-col gap-4">
          {activeReservation && (
            <h2 className="text-sm font-bold text-foreground">
              {t("historyTitle")}
            </h2>
          )}

          {otherEnrollments.map((enrollment) => (
            <ReceiptStatusCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!activeReservation && otherEnrollments.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="default">
              <ReceiptText />
            </EmptyMedia>
            <EmptyTitle>{t("title")}</EmptyTitle>
            <EmptyDescription>{t("statusCard.empty")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/classes" />} className="gap-2">
              <Layers className="size-4" />
              <span>{t("statusCard.viewClasses")}</span>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
