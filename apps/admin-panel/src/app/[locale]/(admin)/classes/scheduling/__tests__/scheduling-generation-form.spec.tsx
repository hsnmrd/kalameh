import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@/test/test-utils"
import type { ClassRequirementDto, SchedulingRunDto } from "@workspace/types"
import {
  branchesResource,
  classRequirementsResource,
  schedulingResource,
  termsResource,
} from "@/lib/api"
import * as stores from "@/lib/stores"
import { SchedulingGenerationForm } from "../components/scheduling-generation-form"

const instituteId = "11111111-1111-4111-8111-111111111111"
const termId = "22222222-2222-4222-8222-222222222222"
const requirementId = "33333333-3333-4333-8333-333333333333"
const refreshedRequirementId = "77777777-7777-4777-8777-777777777777"

const mockActiveInstitute = {
  id: instituteId,
  name: "Test Institute",
  bankCardNumber: "6037991812345678",
  bankAccountName: "حساب مرکزی",
  bankShaba: "IR120170000000123456789012",
}

function buildRequirement(id: string): ClassRequirementDto {
  return {
    id,
    instituteId,
    termId,
    courseId: "66666666-6666-4666-8666-666666666666",
    branchId: null,
    requiredClassCount: 2,
    capacity: 12,
    sessionDurationMinutes: 90,
    sessionsPerWeek: 2,
    totalSessions: null,
    deliveryMode: "IN_PERSON",
    isActive: true,
    term: { id: termId, title: "ترم پاییز" },
    course: {
      id: "66666666-6666-4666-8666-666666666666",
      title: "English A1",
    },
    branch: null,
    createdAt: "2026-08-01",
    updatedAt: "2026-08-01",
  }
}

describe("MVP-034 scheduling generation form", () => {
  afterEach(() => vi.restoreAllMocks())

  it("submits the selected scope and requirements to the generation API", async () => {
    const mutationFn = vi.fn().mockResolvedValue({
      id: "44444444-4444-4444-8444-444444444444",
      instituteId,
      termId,
      requestedByUserId: "55555555-5555-4555-8555-555555555555",
      status: "QUEUED",
      inputSnapshot: {},
      settingsSnapshot: {},
      plans: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies SchedulingRunDto)
    const onCreated = vi.fn()
    const requirementsQueryFn = vi
      .fn()
      .mockResolvedValue([buildRequirement(requirementId)])

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
      activeInstitute: mockActiveInstitute,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", "active"],
      queryFn: async () => [
        {
          id: termId,
          instituteId,
          title: "ترم پاییز",
          startDate: "2026-09-01",
          endDate: "2026-12-01",
          isActive: true,
          studentSchedulesConfirmedAt: "2026-08-01",
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
    } as never)
    const branchId = "33333333-3333-4333-8333-333333333333"
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", "active"],
      queryFn: async () => [{ id: branchId, name: "شعبه ونک", isActive: true }],
    } as never)
    const requirementsQuerySpy = vi
      .spyOn(classRequirementsResource.list, "toQuery")
      .mockImplementation(
        (params) =>
          ({
            queryKey: ["class-requirements", params?.termId ?? "none"],
            queryFn: requirementsQueryFn,
          }) as never
      )
    vi.spyOn(schedulingResource.generate, "toMutation").mockReturnValue({
      mutationFn,
    } as never)

    render(<SchedulingGenerationForm onCreated={onCreated} />)

    // The active eligible term and branch are displayed in the header badges
    expect(await screen.findByText("ترم پاییز")).toBeInTheDocument()
    expect(await screen.findByText("شعبه ونک")).toBeInTheDocument()
    expect(
      screen.queryByRole("combobox", { name: "انتخاب ترم" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("combobox", { name: "انتخاب شعبه" })
    ).not.toBeInTheDocument()
    await waitFor(() =>
      expect(requirementsQuerySpy).toHaveBeenCalledWith(
        expect.objectContaining({ termId })
      )
    )
    await waitFor(() => expect(requirementsQueryFn).toHaveBeenCalled())
    expect(await screen.findByLabelText("English A1")).toBeChecked()
    fireEvent.click(
      screen.getAllByRole("button", { name: "ساخت پیشنهادها" })[0]!
    )

    await waitFor(() => {
      expect(mutationFn.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          instituteId,
          termId,
          branchId,
          requirementIds: [requirementId],
          alternativePlanCount: 1,
        })
      )
      expect(onCreated).toHaveBeenCalledOnce()
    })
  })

  it("revalidates stale requirement ids before generating", async () => {
    const mutationFn = vi.fn().mockResolvedValue({
      id: "44444444-4444-4444-8444-444444444444",
      instituteId,
      termId,
      requestedByUserId: "55555555-5555-4555-8555-555555555555",
      status: "QUEUED",
      inputSnapshot: {},
      settingsSnapshot: {},
      plans: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies SchedulingRunDto)
    const requirementsQueryFn = vi
      .fn()
      .mockResolvedValueOnce([buildRequirement(requirementId)])
      .mockResolvedValue([buildRequirement(refreshedRequirementId)])

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
      activeInstitute: mockActiveInstitute,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", "active"],
      queryFn: async () => [
        {
          id: termId,
          instituteId,
          title: "ترم پاییز",
          startDate: "2026-09-01",
          endDate: "2026-12-01",
          isActive: true,
          studentSchedulesConfirmedAt: "2026-08-01",
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
    } as never)
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", "active"],
      queryFn: async () => [
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "شعبه ونک",
          isActive: true,
        },
      ],
    } as never)
    vi.spyOn(classRequirementsResource.list, "toQuery").mockImplementation(
      (params) =>
        ({
          queryKey: ["class-requirements", params?.termId ?? "none"],
          queryFn: requirementsQueryFn,
        }) as never
    )
    vi.spyOn(schedulingResource.generate, "toMutation").mockReturnValue({
      mutationFn,
    } as never)

    render(<SchedulingGenerationForm onCreated={vi.fn()} />)

    expect(await screen.findByLabelText("English A1")).toBeChecked()
    fireEvent.click(
      screen.getAllByRole("button", { name: "ساخت پیشنهادها" })[0]!
    )

    await waitFor(() =>
      expect(mutationFn).toHaveBeenCalledWith(
        expect.objectContaining({
          requirementIds: [refreshedRequirementId],
        }),
        expect.anything()
      )
    )
  })

  it("disables submit button and prompts confirmation when student schedules are unconfirmed", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
      activeInstitute: mockActiveInstitute,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", "active"],
      queryFn: async () => [
        {
          id: termId,
          instituteId,
          title: "ترم پاییز",
          startDate: "2026-09-01",
          endDate: "2026-12-01",
          isActive: true,
          studentSchedulesConfirmedAt: null,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
    } as never)
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", "active"],
      queryFn: async () => [
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "شعبه ونک",
          isActive: true,
        },
      ],
    } as never)
    vi.spyOn(classRequirementsResource.list, "toQuery").mockImplementation(
      (params) =>
        ({
          queryKey: ["class-requirements", params?.termId ?? "none"],
          queryFn: vi.fn().mockResolvedValue([buildRequirement(requirementId)]),
        }) as never
    )

    render(<SchedulingGenerationForm onCreated={vi.fn()} />)

    expect(await screen.findByText("ترم پاییز")).toBeInTheDocument()
    expect(
      await screen.findByText("تأیید برنامه زمانی فراگیران")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "تأیید برنامه زمانی فراگیران" })
    ).not.toBeInTheDocument()

    const submitButton = screen.getAllByRole("button", {
      name: "ساخت پیشنهادها",
    })[0]!
    expect(submitButton).toBeDisabled()
  })

  it("disables submit button when no requirements are selected", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
      activeInstitute: mockActiveInstitute,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", "active"],
      queryFn: async () => [
        {
          id: termId,
          instituteId,
          title: "ترم پاییز",
          startDate: "2026-09-01",
          endDate: "2026-12-01",
          isActive: true,
          studentSchedulesConfirmedAt: "2026-08-01",
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
    } as never)
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", "active"],
      queryFn: async () => [
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "شعبه ونک",
          isActive: true,
        },
      ],
    } as never)
    vi.spyOn(classRequirementsResource.list, "toQuery").mockImplementation(
      (params) =>
        ({
          queryKey: ["class-requirements", params?.termId ?? "none"],
          queryFn: vi.fn().mockResolvedValue([buildRequirement(requirementId)]),
        }) as never
    )

    render(<SchedulingGenerationForm onCreated={vi.fn()} />)

    const checkbox = await screen.findByLabelText("English A1")
    expect(checkbox).toBeChecked()

    const submitButtons = screen.getAllByRole("button", {
      name: "ساخت پیشنهادها",
    })
    expect(submitButtons[0]).toBeEnabled()

    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
    expect(submitButtons[0]).toBeDisabled()
  })

  it("does not render the bottom section showing number of selected items", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
      activeInstitute: mockActiveInstitute,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", "active"],
      queryFn: async () => [
        {
          id: termId,
          instituteId,
          title: "ترم پاییز",
          startDate: "2026-09-01",
          endDate: "2026-12-01",
          isActive: true,
          studentSchedulesConfirmedAt: "2026-08-01",
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
    } as never)
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", "active"],
      queryFn: async () => [
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "شعبه ونک",
          isActive: true,
        },
      ],
    } as never)
    vi.spyOn(classRequirementsResource.list, "toQuery").mockImplementation(
      (params) =>
        ({
          queryKey: ["class-requirements", params?.termId ?? "none"],
          queryFn: vi.fn().mockResolvedValue([buildRequirement(requirementId)]),
        }) as never
    )

    render(<SchedulingGenerationForm onCreated={vi.fn()} />)

    expect(await screen.findByLabelText("English A1")).toBeInTheDocument()

    // Ensure the old bottom section summary "نیاز انتخاب شده" is NOT rendered
    expect(screen.queryByText(/نیاز انتخاب شده$/)).not.toBeInTheDocument()
  })

  it("renders filter bar with search input and toggles selection directly on mobile button click", async () => {
    const secondReqId = "88888888-8888-4888-8888-888888888888"
    const req1 = buildRequirement(requirementId)
    const req2 = {
      ...buildRequirement(secondReqId),
      course: { id: "c-2", title: "French B1" },
    }

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
      activeInstitute: mockActiveInstitute,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", "active"],
      queryFn: async () => [
        {
          id: termId,
          instituteId,
          title: "ترم پاییز",
          startDate: "2026-09-01",
          endDate: "2026-12-01",
          isActive: true,
          studentSchedulesConfirmedAt: "2026-08-01",
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
    } as never)
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", "active"],
      queryFn: async () => [
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "شعبه ونک",
          isActive: true,
        },
      ],
    } as never)
    vi.spyOn(classRequirementsResource.list, "toQuery").mockImplementation(
      (params) =>
        ({
          queryKey: ["class-requirements", params?.termId ?? "none"],
          queryFn: vi.fn().mockResolvedValue([req1, req2]),
        }) as never
    )

    render(<SchedulingGenerationForm onCreated={vi.fn()} />)

    expect(await screen.findByLabelText("English A1")).toBeInTheDocument()
    expect(screen.getByLabelText("French B1")).toBeInTheDocument()

    // Scope badges are rendered
    expect(screen.getByText("ترم پاییز")).toBeInTheDocument()
    expect(screen.getByText("شعبه ونک")).toBeInTheDocument()

    // Search input is rendered
    const searchInput = screen.getByPlaceholderText(/جست‌وجوی نیازهای کلاسی/i)
    expect(searchInput).toBeInTheDocument()

    // Find the mobile-only selection toggle button in AdminFilterBar
    const toggleBtn = screen.getByRole("button", {
      name: /انتخاب همه|لغو انتخاب همه/i,
    })
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn).toHaveClass("lg:hidden")

    // Initially all are selected, so clicking deselects all
    fireEvent.click(toggleBtn)
    expect(screen.getByLabelText("English A1")).not.toBeChecked()
    expect(screen.getByLabelText("French B1")).not.toBeChecked()

    // Clicking again selects all
    fireEvent.click(toggleBtn)
    expect(screen.getByLabelText("English A1")).toBeChecked()
    expect(screen.getByLabelText("French B1")).toBeChecked()

    // Test search filtering
    fireEvent.change(searchInput, { target: { value: "French" } })
    expect(screen.queryByLabelText("English A1")).not.toBeInTheDocument()
    expect(screen.getByLabelText("French B1")).toBeInTheDocument()
  })

  it("disables submit button and renders finance error banner when institute lacks finance info", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
      activeInstitute: {
        ...mockActiveInstitute,
        bankCardNumber: null,
        bankAccountName: null,
        bankShaba: null,
      },
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", "active"],
      queryFn: async () => [
        {
          id: termId,
          instituteId,
          title: "ترم پاییز",
          startDate: "2026-09-01",
          endDate: "2026-12-01",
          isActive: true,
          studentSchedulesConfirmedAt: "2026-08-01",
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
        },
      ],
    } as never)
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", "active"],
      queryFn: async () => [
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "شعبه ونک",
          isActive: true,
        },
      ],
    } as never)
    vi.spyOn(classRequirementsResource.list, "toQuery").mockImplementation(
      (params) =>
        ({
          queryKey: ["class-requirements", params?.termId ?? "none"],
          queryFn: vi.fn().mockResolvedValue([buildRequirement(requirementId)]),
        }) as never
    )

    render(<SchedulingGenerationForm onCreated={vi.fn()} />)

    expect(await screen.findByLabelText("English A1")).toBeInTheDocument()

    const financeAlert = await screen.findByTestId("scheduling-finance-error")
    expect(financeAlert).toBeInTheDocument()

    const submitButtons = screen.getAllByRole("button", {
      name: "ساخت پیشنهادها",
    })
    expect(submitButtons[0]).toBeDisabled()
  })
})
