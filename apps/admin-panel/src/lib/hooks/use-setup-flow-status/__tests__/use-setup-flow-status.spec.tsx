import { describe, expect, it, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { useSetupFlowStatus } from "../index"
import {
  operatingPhasesResource,
  termsResource,
  studentsResource,
  schedulingResource,
  classesResource,
} from "@/lib/api"

describe("useSetupFlowStatus", () => {
  let queryClient: QueryClient
  const mockInstituteId = "inst-test-123"

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it("returns null focusedKey when instituteId is not provided", () => {
    const { result } = renderHook(
      () => useSetupFlowStatus({ instituteId: null }),
      {
        wrapper,
      }
    )

    expect(result.current.focusedKey).toBeNull()
    expect(result.current.currentStepId).toBeNull()
    expect(result.current.completedCount).toBe(0)
    expect(result.current.isAllCompleted).toBe(false)
  })

  it("focuses Step 1 (operatingPhases) when institute has no operating phases", () => {
    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      []
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      []
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )

    const { result } = renderHook(
      () => useSetupFlowStatus({ instituteId: mockInstituteId }),
      { wrapper }
    )

    expect(result.current.isStep1Done).toBe(false)
    expect(result.current.firstIncompleteIndex).toBe(0)
    expect(result.current.focusedKey).toBe("operatingPhases")
    expect(result.current.currentStepId).toBe("phases")
    expect(result.current.completedCount).toBe(0)
  })

  it("focuses Step 2 (terms) when Step 1 is done but terms is empty", () => {
    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ id: "op-1", name: "Winter Phase" }]
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      []
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )

    const { result } = renderHook(
      () => useSetupFlowStatus({ instituteId: mockInstituteId }),
      { wrapper }
    )

    expect(result.current.isStep1Done).toBe(true)
    expect(result.current.isStep2Done).toBe(false)
    expect(result.current.firstIncompleteIndex).toBe(1)
    expect(result.current.focusedKey).toBe("terms")
    expect(result.current.currentStepId).toBe("terms")
    expect(result.current.completedCount).toBe(1)
  })

  it("focuses Step 3 (students) when Steps 1 and 2 are done but students is empty", () => {
    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ id: "op-1" }]
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "term-1" }]
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      []
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )

    const { result } = renderHook(
      () => useSetupFlowStatus({ instituteId: mockInstituteId }),
      { wrapper }
    )

    expect(result.current.isStep1Done).toBe(true)
    expect(result.current.isStep2Done).toBe(true)
    expect(result.current.isStep3Done).toBe(false)
    expect(result.current.firstIncompleteIndex).toBe(2)
    expect(result.current.focusedKey).toBe("students")
    expect(result.current.currentStepId).toBe("students")
    expect(result.current.completedCount).toBe(2)
  })

  it("focuses Step 4/5 (classes) when Steps 1, 2, 3 are done but scheduling or classes are incomplete", () => {
    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ id: "op-1" }]
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "term-1" }]
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "student-1" }]
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      []
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )

    const { result } = renderHook(
      () => useSetupFlowStatus({ instituteId: mockInstituteId }),
      { wrapper }
    )

    expect(result.current.isStep3Done).toBe(true)
    expect(result.current.isStep4Done).toBe(false)
    expect(result.current.firstIncompleteIndex).toBe(3)
    expect(result.current.focusedKey).toBe("classes")
    expect(result.current.currentStepId).toBe("scheduling")
  })

  it("returns null focusedKey when all steps are completed", () => {
    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ id: "op-1" }]
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "term-1" }]
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "student-1" }]
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ termId: "term-1", schedulingStatus: "PUBLISHED" }]
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "class-1" }]
    )

    const { result } = renderHook(
      () =>
        useSetupFlowStatus({ instituteId: mockInstituteId, classesCount: 1 }),
      { wrapper }
    )

    expect(result.current.isAllCompleted).toBe(true)
    expect(result.current.focusedKey).toBeNull()
    expect(result.current.currentStepId).toBeNull()
    expect(result.current.completedCount).toBe(5)
  })

  it("focuses 'classes' when an active term has 0 classes, even if old classes exist from past terms", () => {
    const pastTerm = {
      id: "term-past",
      title: "Past Term",
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      classesCount: 3,
    }

    const currentActiveTerm = {
      id: "term-active",
      title: "Active Term",
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      classesCount: 0,
    }

    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ id: "op-1" }]
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [pastTerm, currentActiveTerm]
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "student-1" }]
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ termId: "term-past", schedulingStatus: "PUBLISHED" }]
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [
        { id: "class-old-1", termId: "term-past" },
        { id: "class-old-2", termId: "term-past" },
        { id: "class-old-3", termId: "term-past" },
      ]
    )

    const { result } = renderHook(
      () => useSetupFlowStatus({ instituteId: mockInstituteId }),
      { wrapper }
    )

    expect(result.current.isStep1Done).toBe(true)
    expect(result.current.isStep2Done).toBe(true)
    expect(result.current.isStep3Done).toBe(true)
    expect(result.current.isStep4Done).toBe(true)
    expect(result.current.isStep5Done).toBe(false)
    expect(result.current.firstIncompleteIndex).toBe(4)
    expect(result.current.focusedKey).toBe("classes")
    expect(result.current.currentStepId).toBe("classes")
    expect(result.current.isAllCompleted).toBe(false)
  })

  it("removes 'classes' focus once the active term has at least one class", () => {
    const currentActiveTerm = {
      id: "term-active",
      title: "Active Term",
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      classesCount: 1,
    }

    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ id: "op-1" }]
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [currentActiveTerm]
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "student-1" }]
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ termId: "term-active", schedulingStatus: "PUBLISHED" }]
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "class-1", termId: "term-active" }]
    )

    const { result } = renderHook(
      () => useSetupFlowStatus({ instituteId: mockInstituteId }),
      { wrapper }
    )

    expect(result.current.isStep5Done).toBe(true)
    expect(result.current.focusedKey).toBeNull()
    expect(result.current.isAllCompleted).toBe(true)
  })
})
