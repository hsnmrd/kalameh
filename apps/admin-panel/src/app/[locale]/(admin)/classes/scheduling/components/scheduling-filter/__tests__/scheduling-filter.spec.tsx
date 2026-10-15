import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@/test/test-utils"
import { SchedulingFilter } from "../index"
import * as stores from "@/lib/stores"
import { branchesResource } from "@/lib/api"
import type { SchedulingTermSummaryDto } from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock("@/lib/stores", () => ({
  useActiveInstitute: vi.fn(),
}))

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    branchesResource: {
      ...actual.branchesResource,
      list: {
        toQuery: vi.fn(),
      },
    },
  }
})

describe("SchedulingFilter Component", () => {
  const mockTerm: SchedulingTermSummaryDto = {
    id: "term-1",
    title: "مهر و آبان ۱۴۰۵",
    startDate: "2026-10-01",
    endDate: "2026-11-30",
    isActive: true,
    classesCount: 5,
    requirementsCount: 5,
    totalRequiredClasses: 5,
  }

  const mockBranches = [
    { id: "b-1", name: "شعبه مرکزی", isActive: true },
    { id: "b-2", name: "شعبه ونک", isActive: true },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(stores.useActiveInstitute).mockReturnValue({
      activeInstituteId: "inst-1",
    } as any)

    vi.mocked(branchesResource.list.toQuery).mockReturnValue({
      queryKey: ["branches", "list", "inst-1"],
      queryFn: async () => mockBranches,
    } as any)
  })

  it("renders title card in header instead of branch select element when no branch is selected", () => {
    render(
      <SchedulingFilter
        term={mockTerm}
        branchId=""
        onBranchChange={vi.fn()}
        maxStudentsPerClass={14}
        onMaxStudentsPerClassChange={vi.fn()}
        maxAvailableRoomCapacity={20}
        onGenerateSchedule={vi.fn()}
      />
    )

    // Should display the header card with title and term badge
    expect(screen.getByText("انتخاب شعبه برای برنامه‌ریزی")).toBeInTheDocument()
    expect(screen.getByText("مهر و آبان ۱۴۰۵")).toBeInTheDocument()

    // Should NOT show the action button or branch combobox
    expect(
      screen.queryByRole("button", { name: "ثبت و ادامه" })
    ).not.toBeInTheDocument()
  })

  it("renders branch select element and generate button when branch is selected", async () => {
    render(
      <SchedulingFilter
        term={mockTerm}
        branchId="b-1"
        onBranchChange={vi.fn()}
        maxStudentsPerClass={14}
        onMaxStudentsPerClassChange={vi.fn()}
        maxAvailableRoomCapacity={20}
        onGenerateSchedule={vi.fn()}
      />
    )

    // Should NOT show the no-branch header card
    expect(
      screen.queryByText("انتخاب شعبه برای برنامه‌ریزی")
    ).not.toBeInTheDocument()

    // Should show the action button
    expect(
      screen.getByRole("button", { name: /ثبت و ادامه/ })
    ).toBeInTheDocument()
  })

  it("disables the submit button and fires toast error on click when disabled with reason", () => {
    const handleGenerate = vi.fn()
    render(
      <SchedulingFilter
        term={mockTerm}
        branchId="b-1"
        onBranchChange={vi.fn()}
        maxStudentsPerClass={14}
        onMaxStudentsPerClassChange={vi.fn()}
        maxAvailableRoomCapacity={20}
        onGenerateSchedule={handleGenerate}
        disabled={true}
        disabledReason="خطای پیش‌نیاز"
      />
    )

    const button = screen.getByRole("button", { name: /ثبت و ادامه/ })
    expect(button).toBeDisabled()

    fireEvent.click(button)
    expect(handleGenerate).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("خطای پیش‌نیاز")
  })
})
