"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { ArrowRight, CircleAlert, RotateCcw } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  APP_MODULES,
  PERMISSIONS,
  type SchedulingPlanDetailsDto,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import { formatNumber } from "@workspace/ui/lib/utils"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { useRouter } from "@/i18n/routing"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { useSchedulingPlanDetail } from "../../hooks/use-scheduling-plan-details"
import { useSchedulingPlanValidation } from "../../hooks/use-scheduling-plan-validation"
import { SchedulingPlanDetailsContent } from "../../components/scheduling-plan-details-content"
import { PlanDetailsHeader } from "./components/plan-details-header"

export default function SchedulingPlanDetailsPage() {
  const t = useTranslations("scheduling")
  const locale = useLocale()
  const router = useRouter()
  const params = useParams()
  const planId = (params.planId as string) || ""
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const planQuery = useSchedulingPlanDetail(planId)
  const plan = planQuery.data

  const validation = useSchedulingPlanValidation(
    plan?.id ?? "",
    plan?.updatedAt ?? ""
  )

  const selectionMutation = useMutation({
    ...schedulingResource.selectPlan.toMutation(),
    onSuccess: (result) => {
      queryClient.setQueryData<SchedulingPlanDetailsDto>(
        schedulingResource.planDetail.key({
          planId: result.planId,
          instituteId: activeInstituteId,
        }),
        (current) => {
          if (!current) return current
          return {
            ...current,
            status: "SELECTED",
            selectedAt: result.selectedAt,
          }
        }
      )
      toast.success(t("comparison.selection.success"))
      planQuery.refetch()
    },
  })

  const handleSelect = React.useCallback(() => {
    if (!planId) return
    selectionMutation.mutate({ planId, instituteId: activeInstituteId })
  }, [planId, activeInstituteId, selectionMutation])

  const breadcrumb = React.useMemo(
    () => (
      <AdminBreadcrumb
        backHref={
          plan?.runId ? `/scheduling/runs/${plan.runId}` : "/scheduling"
        }
        backLabel={plan?.run?.term?.title ?? t("title")}
        items={[
          { label: t("title"), href: "/scheduling" },
          ...(plan?.runId
            ? [
                {
                  label: plan.run?.term?.title ?? t("runStatus.pageTitle"),
                  href: `/scheduling/runs/${plan.runId}`,
                },
              ]
            : []),
          {
            label: plan
              ? t("planDetails.title", {
                  rank: formatNumber(plan.rank, locale),
                })
              : t("planDetails.title", { rank: "" }),
          },
        ]}
      />
    ),
    [plan, locale, t]
  )

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <AdminPageShell breadcrumb={breadcrumb}>
          {planQuery.isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Spinner className="size-8 text-foreground" />
            </div>
          ) : plan ? (
            <div className="flex flex-col gap-6">
              <PlanDetailsHeader
                plan={plan}
                isSelected={plan.status === "SELECTED"}
                isSelectionPending={selectionMutation.isPending}
                isSelecting={selectionMutation.isPending}
                isValidationPending={validation.isPending}
                hasValidationResult={Boolean(validation.result)}
                validationResult={validation.result}
                onSelect={handleSelect}
                onValidate={validation.validate}
                onValidationBlocked={validation.setResult}
              />
              <SchedulingPlanDetailsContent
                plan={plan}
                isSelected={plan.status === "SELECTED"}
                validationResult={validation.result}
                stickyTop="page"
              />
            </div>
          ) : (
            <Empty
              variant="compact"
              aria-live="polite"
              className="rounded-2xl border border-border bg-card"
            >
              <EmptyMedia variant="destructive">
                <CircleAlert aria-hidden />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{t("planDetails.notFound.title")}</EmptyTitle>
                <EmptyDescription>
                  {planQuery.error instanceof Error
                    ? planQuery.error.message
                    : t("planDetails.notFound.description")}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => planQuery.refetch()}
                    disabled={planQuery.isFetching}
                  >
                    {planQuery.isFetching ? (
                      <Spinner data-icon="inline-start" size="sm" />
                    ) : (
                      <RotateCcw data-icon="inline-start" className="size-4" />
                    )}
                    {t("planDetails.notFound.retry")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.push("/scheduling")}
                  >
                    <ArrowRight data-icon="inline-start" className="size-4" />
                    {t("planDetails.notFound.back")}
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          )}
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
