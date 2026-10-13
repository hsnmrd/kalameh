import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@/test/test-utils"
import { SchedulingBranchSelection } from "../index"
import * as stores from "@/lib/stores"
import { classesResource } from "@/lib/api"
import type { BranchDto, SchedulingTermSummaryDto } from "@workspace/types"

vi.mock("@/lib/stores", () => ({
  useActiveInstitute: vi.fn(),
}))

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    classesResource: {
      ...actual.classesResource,
      list: {
        toQuery: vi.fn(),
      },
    },
  }
})

describe("SchedulingBranchSelection Component", () => {
  const mockBranches: BranchDto[] = [
    {
      id: "branch-1",
      instituteId: "inst-1",
      name: "شعبه مرکزی",
      address: "خیابان ولیعصر، پلاک ۱۰",
      phones: ["02188888888"],
      isActive: true,
      classesCount: 12,
      usersCount: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "branch-2",
      instituteId: "inst-1",
      name: "شعبه ونک",
      address: "میدان ونک، برج نگار",
      phones: ["02188889999"],
      isActive: true,
      classesCount: 0,
      usersCount: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  const mockTerm: SchedulingTermSummaryDto = {
    id: "term-fall",
    title: "مهر و آبان ۱۴۰۵",
    startDate: "2026-10-01",
    endDate: "2026-11-30",
    isActive: true,
    classesCount: 3,
    requirementsCount: 3,
    totalRequiredClasses: 3,
  }

  const mockTermClasses = [
    {
      id: "cls-1",
      title: "گروه A",
      branchId: "branch-1",
      termId: "term-fall",
    },
    {
      id: "cls-2",
      title: "گروه B",
      branchId: "branch-1",
      termId: "term-fall",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(stores.useActiveInstitute).mockReturnValue({
      activeInstituteId: "inst-1",
    } as any)

    vi.mocked(classesResource.list.toQuery).mockReturnValue({
      queryKey: ["classes", "list", "inst-1", "term-fall"],
      queryFn: async () => mockTermClasses,
    } as any)
  })

  it("renders list of branches with addresses and details", async () => {
    render(
      <SchedulingBranchSelection
        branches={mockBranches}
        selectedTerm={mockTerm}
        onSelectBranch={vi.fn()}
      />
    )

    expect(screen.getByText("شعبه مرکزی")).toBeInTheDocument()
    expect(screen.getByText("شعبه ونک")).toBeInTheDocument()
    expect(screen.getByText("خیابان ولیعصر، پلاک ۱۰")).toBeInTheDocument()
  })

  it("shows registered classes badge for branch with classes in current active term", async () => {
    render(
      <SchedulingBranchSelection
        branches={mockBranches}
        selectedTerm={mockTerm}
        onSelectBranch={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(
        screen.getByText(/دارای ۲ کلاس ثبت‌شده در این ترم/)
      ).toBeInTheDocument()
    })
  })

  it("shows no classes badge for branch without classes in current active term", async () => {
    render(
      <SchedulingBranchSelection
        branches={mockBranches}
        selectedTerm={mockTerm}
        onSelectBranch={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/بدون کلاس در این ترم/)).toBeInTheDocument()
    })
  })

  it("calls onSelectBranch when a branch card is clicked", async () => {
    const handleSelectBranch = vi.fn()

    render(
      <SchedulingBranchSelection
        branches={mockBranches}
        selectedTerm={mockTerm}
        onSelectBranch={handleSelectBranch}
      />
    )

    fireEvent.click(screen.getByText("شعبه ونک"))
    expect(handleSelectBranch).toHaveBeenCalledWith("branch-2")
  })
})
