import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "../../../../../test/test-utils"
import ClassroomsPage from "../page"
import * as stores from "@/lib/stores"
import { branchesResource, classroomsResource } from "@/lib/api"
import type { ClassroomDto, BranchWithStats } from "@workspace/types"

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockBranches: BranchWithStats[] = [
  {
    id: "branch-1",
    instituteId: "inst-1",
    name: "شعبه مرکزی",
    address: "تهران",
    phones: [],
    isActive: true,
    classesCount: 3,
    usersCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockClassrooms: ClassroomDto[] = [
  {
    id: "room-1",
    instituteId: "inst-1",
    branchId: "branch-1",
    name: "کلاس ۱۰۱",
    capacity: 20,
    description: "دارای ویدئو پروژکتور",
    isActive: true,
    branch: {
      id: "branch-1",
      name: "شعبه مرکزی",
    },
    classesCount: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "room-2",
    instituteId: "inst-1",
    branchId: null,
    name: "سایت کامپیوتر",
    capacity: 15,
    description: "۱۵ سیستم کامپیوتری",
    isActive: true,
    branch: null,
    classesCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

describe("ClassroomsPage", () => {
  beforeEach(() => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: "inst-1",
      activeInstitute: null,
      setActiveInstitute: vi.fn(),
      clearActiveInstitute: vi.fn(),
      isHydrated: true,
    })

    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", { instituteId: "inst-1" }],
      queryFn: async () => mockBranches,
    } as any)

    vi.spyOn(classroomsResource.list, "toQuery").mockReturnValue({
      queryKey: ["classrooms", { instituteId: "inst-1" }],
      queryFn: async () => mockClassrooms,
    } as any)
  })

  it("should render classrooms table with names, branches, and capacities", async () => {
    render(<ClassroomsPage />)

    await waitFor(() => {
      expect(screen.getByText("کلاس ۱۰۱")).toBeInTheDocument()
      expect(screen.getByText("سایت کامپیوتر")).toBeInTheDocument()
      expect(screen.getByText("شعبه مرکزی")).toBeInTheDocument()
      expect(screen.getByText(/دارای ویدئو پروژکتور/)).toBeInTheDocument()
    })
  })

  it("should display the add classroom button", async () => {
    render(<ClassroomsPage />)

    const addButtons = screen.getAllByRole("button", {
      name: /افزودن کلاس درس جدید/i,
    })
    expect(addButtons.length).toBeGreaterThan(0)
  })
})
