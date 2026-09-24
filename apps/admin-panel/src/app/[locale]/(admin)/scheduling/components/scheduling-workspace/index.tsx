"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Calendar } from "lucide-react"
import type { SchedulingRunDto, TermDemandReportDto } from "@workspace/types"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminPageShell } from "@/components/admin-page-shell"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { selectDefaultSchedulingTerm } from "../../helper/term-selection"
import { SchedulingDemandView } from "../scheduling-demand-view"
import { SchedulingFab } from "../scheduling-fab"
import { SchedulingFilter } from "../scheduling-filter"
import { SchedulingGenerationForm } from "../scheduling-generation-form"
import { SchedulingRunStatusPanel } from "../scheduling-run-status-panel"
import { TermSummaryBar } from "../term-summary-bar"

export function SchedulingWorkspace() {
  const t = useTranslations("scheduling")
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { activeInstituteId } = useActiveInstitute()

  const [selectedTermId, setSelectedTermId] = React.useState<string>(() => {
    return searchParams.get("termId") || ""
  })
  const [branchId, setBranchId] = React.useState("")
  const [demandData, setDemandData] =
    React.useState<TermDemandReportDto | null>(null)
  const [createdRun, setCreatedRun] = React.useState<SchedulingRunDto | null>(
    null
  )
  const [showGenerationForm, setShowGenerationForm] = React.useState(false)

  const termsQuery = useQuery({
    ...schedulingResource.terms.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId),
  })

  // When terms data loads or updates, resolve default selected term if needed
  React.useEffect(() => {
    const terms = termsQuery.data
    if (!terms || terms.length === 0) {
      if (selectedTermId) setSelectedTermId("")
      return
    }

    const currentSelectedExists = terms.some((t) => t.id === selectedTermId)
    if (currentSelectedExists) {
      return
    }

    const paramTermId = searchParams.get("termId")
    const paramTermExists =
      paramTermId && terms.some((t) => t.id === paramTermId)

    if (paramTermExists) {
      setSelectedTermId(paramTermId)
      return
    }

    const defaultTerm = selectDefaultSchedulingTerm(terms)
    if (defaultTerm) {
      setSelectedTermId(defaultTerm.id)
    }
  }, [termsQuery.data, selectedTermId, searchParams])

  // Reset state when institute changes
  React.useEffect(() => {
    setBranchId("")
    setDemandData(null)
    setCreatedRun(null)
    setShowGenerationForm(false)
    setSelectedTermId("")
  }, [activeInstituteId])

  const termOptions = React.useMemo(() => {
    return (termsQuery.data ?? []).map((term) => ({
      value: term.id,
      label: term.title,
    }))
  }, [termsQuery.data])

  const selectedTerm = React.useMemo(() => {
    return termsQuery.data?.find((term) => term.id === selectedTermId)
  }, [termsQuery.data, selectedTermId])

  const calculateMutation = useMutation({
    ...schedulingResource.calculateDemand.toMutation(),
    onSuccess: (data) => {
      setDemandData(data)
    },
  })

  // Automatically trigger demand calculation when selected term or branch changes
  React.useEffect(() => {
    if (selectedTermId) {
      calculateMutation.mutate({
        termId: selectedTermId,
        branchId: branchId && branchId !== "all" ? branchId : undefined,
        instituteId: activeInstituteId || undefined,
        defaultCapacity: 14,
      })
    } else {
      setDemandData(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTermId, branchId, activeInstituteId])

  const handleTermChange = React.useCallback(
    (newTermId: string) => {
      setSelectedTermId(newTermId)
      setCreatedRun(null)
      setShowGenerationForm(false)
      const params = new URLSearchParams(searchParams.toString())
      if (newTermId) {
        params.set("termId", newTermId)
      } else {
        params.delete("termId")
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [router, pathname, searchParams]
  )

  const activeRun =
    createdRun?.instituteId === activeInstituteId ? createdRun : null

  return (
    <AdminPageShell
      filter={
        <SchedulingFilter
          termId={selectedTermId}
          onTermChange={handleTermChange}
          termOptions={termOptions}
          branchId={branchId}
          onBranchChange={setBranchId}
          hasActiveRun={Boolean(activeRun)}
          onNewRun={() => {
            setCreatedRun(null)
            setShowGenerationForm(true)
          }}
        />
      }
      fab={<SchedulingFab termId={selectedTermId} />}
    >
      {termsQuery.isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner className="size-8 text-foreground" />
        </div>
      ) : !termsQuery.data || termsQuery.data.length === 0 ? (
        <Empty variant="default" className="border border-border bg-card">
          <EmptyMedia variant="icon">
            <Calendar className="size-7 text-foreground" aria-hidden />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("termsList.empty.title")}</EmptyTitle>
            <EmptyDescription>
              {t("termsList.empty.description")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          <TermSummaryBar
            term={selectedTerm}
            isLoading={termsQuery.isLoading}
          />

          {activeRun ? (
            <SchedulingRunStatusPanel
              run={activeRun}
              onReset={() => {
                setCreatedRun(null)
                setShowGenerationForm(false)
              }}
            />
          ) : showGenerationForm ? (
            <SchedulingGenerationForm
              termOptions={termOptions}
              defaultTermId={selectedTermId}
              onCreated={(run) => {
                setCreatedRun(run)
                setShowGenerationForm(false)
              }}
              onNavigateToDemand={() => setShowGenerationForm(false)}
            />
          ) : (
            <SchedulingDemandView
              termId={selectedTermId}
              demandData={demandData}
              isLoading={calculateMutation.isPending}
              termOptions={termOptions}
              onTermChange={handleTermChange}
              onGenerateTimetable={() => setShowGenerationForm(true)}
            />
          )}
        </div>
      )}
    </AdminPageShell>
  )
}
