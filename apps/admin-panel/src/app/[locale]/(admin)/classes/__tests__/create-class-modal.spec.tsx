import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "../../../../../test/test-utils"
import { CreateClassModal } from "../components/create-class-modal"
import * as stores from "@/lib/stores"
import {
  branchesResource,
  classroomsResource,
  coursesResource,
  termsResource,
} from "@/lib/api"

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe("CreateClassModal - Branch Defaulting", () => {
  beforeEach(() => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: "inst-1",
      activeInstitute: null,
      setActiveInstitute: vi.fn(),
      clearActiveInstitute: vi.fn(),
      isHydrated: true,
    })

    vi.spyOn(termsResource.list, "toQuery").mockReturnValue({
      queryKey: ["terms", { instituteId: "inst-1" }],
      queryFn: async () => [
        {
          id: "term-1",
          instituteId: "inst-1",
          title: "پاییز ۱۴۰۵",
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    vi.spyOn(coursesResource.list, "toQuery").mockReturnValue({
      queryKey: ["courses", { instituteId: "inst-1" }],
      queryFn: async () => [
        {
          id: "course-1",
          instituteId: "inst-1",
          title: "Top Notch 1A",
          baseFee: 1500000,
          prerequisiteId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    vi.spyOn(classroomsResource.list, "toQuery").mockReturnValue({
      queryKey: ["classrooms", { instituteId: "inst-1" }],
      queryFn: async () => [],
    } as any)
  })

  it("should auto-select the single branch as default when only 1 branch exists", async () => {
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", { instituteId: "inst-1" }],
      queryFn: async () => [
        {
          id: "branch-central",
          instituteId: "inst-1",
          name: "شعبه مرکزی",
          address: "تهران",
          phones: [],
          isActive: true,
          classesCount: 0,
          usersCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    render(<CreateClassModal open={true} onClose={vi.fn()} />)

    // Verify dialog rendered
    expect(
      screen.getByRole("heading", { name: /تعریف کلاس جدید/i })
    ).toBeInTheDocument()

    // Wait for the single branch to be auto-selected
    await waitFor(() => {
      expect(screen.getByText("شعبه مرکزی")).toBeInTheDocument()
    })
  })

  it("should not select any branch by default when multiple branches exist", async () => {
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches-multi", { instituteId: "inst-1" }],
      queryFn: async () => [
        {
          id: "branch-1",
          instituteId: "inst-1",
          name: "شعبه شرق",
          address: "تهران شرق",
          phones: [],
          isActive: true,
          classesCount: 0,
          usersCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "branch-2",
          instituteId: "inst-1",
          name: "شعبه غرب",
          address: "تهران غرب",
          phones: [],
          isActive: true,
          classesCount: 0,
          usersCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    render(<CreateClassModal open={true} onClose={vi.fn()} />)

    // When multiple branches exist, placeholder should be shown
    await waitFor(() => {
      expect(screen.getByText("انتخاب شعبه (اختیاری)")).toBeInTheDocument()
    })
  })

  it("should display term details preview when a term is selected", async () => {
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches-none", { instituteId: "inst-1" }],
      queryFn: async () => [],
    } as any)

    render(<CreateClassModal open={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/بازه زمانی ترم:/i)).toBeInTheDocument()
      expect(screen.getByText(/ترم فعال/i)).toBeInTheDocument()
    })
  })

  it("should open classroom picker modal and allow selecting a classroom", async () => {
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches-test", { instituteId: "inst-1" }],
      queryFn: async () => [],
    } as any)

    vi.spyOn(classroomsResource.list, "toQuery").mockReturnValue({
      queryKey: ["classrooms-picker-test", { instituteId: "inst-1" }],
      queryFn: async () => [
        {
          id: "room-101",
          instituteId: "inst-1",
          branchId: null,
          name: "اتاق ۱۰۱",
          capacity: 20,
          description: "اتاق کنفرانس",
          isActive: true,
          classesCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    render(<CreateClassModal open={true} onClose={vi.fn()} />)

    // Trigger button should show classroom placeholder
    const trigger = await screen.findByText("انتخاب کلاس درس (اختیاری)")
    expect(trigger).toBeInTheDocument()

    // Click trigger to open modal
    fireEvent.click(trigger)

    // Modal title should now be in the document
    expect(
      await screen.findByRole("heading", {
        name: /انتخاب کلاس درس \/ اتاق فیزیکی/i,
      })
    ).toBeInTheDocument()

    // Select the room from the list once query resolves
    const roomOption = await screen.findByText("اتاق ۱۰۱")
    const roomButton = roomOption.closest("button") || roomOption
    fireEvent.click(roomButton)

    // Trigger button should now show selected room name
    await waitFor(() => {
      expect(screen.getByText(/اتاق ۱۰۱ \(20 نفر\)/i)).toBeInTheDocument()
    })
  })

  it("should display remote state with badge in trigger when remote option is selected, and allow clearing", async () => {
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches-remote-test", { instituteId: "inst-1" }],
      queryFn: async () => [],
    } as any)

    vi.spyOn(classroomsResource.list, "toQuery").mockReturnValue({
      queryKey: ["classrooms-remote-test", { instituteId: "inst-1" }],
      queryFn: async () => [],
    } as any)

    render(<CreateClassModal open={true} onClose={vi.fn()} />)

    // Trigger button should show classroom placeholder
    const trigger = await screen.findByText("انتخاب کلاس درس (اختیاری)")
    fireEvent.click(trigger)

    // Click "بدون اتاق / کلاس آنلاین"
    const remoteOption = await screen.findByText("بدون اتاق / کلاس آنلاین")
    const remoteButton = remoteOption.closest("button") || remoteOption
    fireEvent.click(remoteButton)

    // Trigger should now show remote text and badge
    await waitFor(() => {
      expect(
        screen.getByText("کلاس آنلاین / بدون اتاق فیزیکی")
      ).toBeInTheDocument()
      expect(screen.getByText("آنلاین / ریموت")).toBeInTheDocument()
    })

    // Click clear button (X)
    const clearButton = screen.getByRole("button", {
      name: /بدون اتاق \/ کلاس آنلاین/i,
    })
    fireEvent.click(clearButton)

    // Should return to placeholder
    await waitFor(() => {
      expect(screen.getByText("انتخاب کلاس درس (اختیاری)")).toBeInTheDocument()
    })
  })
})
