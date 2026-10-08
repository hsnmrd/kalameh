"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  operatingPhasesResource,
  termsResource,
  studentsResource,
  schedulingResource,
  classesResource,
} from "@/lib/api"
import type { NavItemKey } from "@/components/admin-base-layout/nav-list"
import { areActiveTermsHavingClasses } from "./utils"

export interface UseSetupFlowStatusOptions {
  instituteId?: string | null
  classesCount?: number
}

export interface SetupFlowStatusResult {
  isStep1Done: boolean
  isStep2Done: boolean
  isStep3Done: boolean
  isStep4Done: boolean
  isStep5Done: boolean
  isSubstep1Done: boolean
  isSubstep2Done: boolean
  isSubstep3Done: boolean
  focusedKey: NavItemKey | null
  currentStepId:
    "phases" | "terms" | "students" | "scheduling" | "classes" | null
  firstIncompleteIndex: number
  completedCount: number
  totalSteps: number
  isAllCompleted: boolean
}

export function useSetupFlowStatus({
  instituteId,
  classesCount = 0,
}: UseSetupFlowStatusOptions = {}): SetupFlowStatusResult {
  const isEnabled = Boolean(instituteId)

  const { data: operatingPhases = [] } = useQuery({
    ...operatingPhasesResource.list.toQuery({ instituteId: instituteId! }),
    enabled: isEnabled,
  })

  const { data: terms = [] } = useQuery({
    ...termsResource.list.toQuery({ instituteId: instituteId! }),
    enabled: isEnabled,
  })

  const { data: students = [] } = useQuery({
    ...studentsResource.list.toQuery({ instituteId: instituteId! }),
    enabled: isEnabled,
  })

  const { data: schedulingTerms = [] } = useQuery({
    ...schedulingResource.terms.toQuery({ instituteId: instituteId! }),
    enabled: isEnabled,
  })

  const { data: classes = [] } = useQuery({
    ...classesResource.list.toQuery({ instituteId: instituteId! }),
    enabled: isEnabled,
  })

  // Evaluate step completion
  const isStep1Done = operatingPhases.length > 0
  const isStep2Done = terms.length > 0
  const isStep3Done = students.length > 0

  const isSubstep1Done = schedulingTerms.some(
    (t) => t.requirementsCount > 0 || t.schedulingStatus !== "NO_REQUIREMENTS"
  )
  const isSubstep2Done = schedulingTerms.some(
    (t) =>
      t.latestRun !== null ||
      ["GENERATING", "SCHEDULED", "PUBLISHED"].includes(t.schedulingStatus)
  )
  const isSubstep3Done = schedulingTerms.some((t) =>
    ["SCHEDULED", "PUBLISHED"].includes(t.schedulingStatus)
  )

  const isStep4Done = isSubstep3Done
  const isStep5Done = areActiveTermsHavingClasses({
    terms,
    classes,
    fallbackClassesCount: classesCount,
  })

  const stepDoneFlags = React.useMemo(
    () => [isStep1Done, isStep2Done, isStep3Done, isStep4Done, isStep5Done],
    [isStep1Done, isStep2Done, isStep3Done, isStep4Done, isStep5Done]
  )

  const firstIncompleteIndex = React.useMemo(
    () => stepDoneFlags.findIndex((done) => !done),
    [stepDoneFlags]
  )

  const completedCount = React.useMemo(
    () => stepDoneFlags.filter(Boolean).length,
    [stepDoneFlags]
  )

  const isAllCompleted = firstIncompleteIndex === -1

  const currentStepId = React.useMemo(() => {
    if (!isEnabled || isAllCompleted) return null
    switch (firstIncompleteIndex) {
      case 0:
        return "phases"
      case 1:
        return "terms"
      case 2:
        return "students"
      case 3:
        return "scheduling"
      case 4:
        return "classes"
      default:
        return null
    }
  }, [isEnabled, isAllCompleted, firstIncompleteIndex])

  // Single most important incomplete nav item gets focus
  const focusedKey = React.useMemo<NavItemKey | null>(() => {
    if (!isEnabled || isAllCompleted) return null
    switch (firstIncompleteIndex) {
      case 0:
        return "operatingPhases"
      case 1:
        return "terms"
      case 2:
        return "students"
      case 3:
      case 4:
        return "classes"
      default:
        return null
    }
  }, [isEnabled, isAllCompleted, firstIncompleteIndex])

  return {
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    isStep5Done,
    isSubstep1Done,
    isSubstep2Done,
    isSubstep3Done,
    focusedKey,
    currentStepId,
    firstIncompleteIndex,
    completedCount,
    totalSteps: 5,
    isAllCompleted,
  }
}
