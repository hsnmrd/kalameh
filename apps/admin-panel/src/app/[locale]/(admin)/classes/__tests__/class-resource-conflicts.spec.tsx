import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "../../../../../test/test-utils"
import type { ClassDto, TeacherDto, TermDto } from "@workspace/types"
import * as stores from "@/lib/stores"
import {
  branchesResource,
  classesResource,
  classroomsResource,
  coursesResource,
  teachersResource,
  termsResource,
} from "@/lib/api"
import {
  computeLocalScheduleConflicts,
  findClassroomScheduleConflict,
  findTeacherScheduleConflict,
  formatClassScheduleString,
} from "../helper/class-resource-conflicts"
import { EditClassModal } from "../components/edit-class-modal"

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockTerm: TermDto = {
  id: "term-1",
  instituteId: "inst-1",
  title: "پاییز ۱۴۰۵",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockTeacher1: TeacherDto = {
  id: "teacher-1",
  instituteId: "inst-1",
  firstName: "مریم",
  lastName: "احمدی",
  phone: "09121111111",
  role: "TEACHER",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  teacherProfile: {
    id: "tp-1",
    userId: "teacher-1",
    availabilities: [
      {
        id: "av-1",
        teacherProfileId: "tp-1",
        dayOfWeek: "SATURDAY",
        startTime: "16:00",
        endTime: "20:00",
      },
    ],
    qualifications: [],
  },
}

const mockTeacher2: TeacherDto = {
  id: "teacher-2",
  instituteId: "inst-1",
  firstName: "سارا",
  lastName: "رضایی",
  phone: "09122222222",
  role: "TEACHER",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  teacherProfile: {
    id: "tp-2",
    userId: "teacher-2",
    availabilities: [
      {
        id: "av-2",
        teacherProfileId: "tp-2",
        dayOfWeek: "SATURDAY",
        startTime: "16:00",
        endTime: "20:00",
      },
    ],
    qualifications: [],
  },
}

const otherTermClass: ClassDto = {
  id: "class-other",
  instituteId: "inst-1",
  termId: "term-1",
  courseId: "course-1",
  branchId: "branch-1",
  classroomId: "room-busy",
  title: "Top Notch 2B",
  capacity: 15,
  enrolledCount: 5,
  fee: 1500000,
  teacherId: "teacher-2",
  teacherName: "سارا رضایی",
  schedule: null,
  daysOfWeek: ["SATURDAY"],
  sessionDates: ["2026-09-26"],
  startTime: "17:00",
  endTime: "18:30",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe("class-resource-conflicts helpers", () => {
  it("formats fallback schedule string when cls.schedule is null", () => {
    const formatted = formatClassScheduleString(
      {
        schedule: null,
        daysOfWeek: ["SATURDAY", "MONDAY"],
        startTime: "17:00",
        endTime: "18:30",
      },
      (day) => (day === "SATURDAY" ? "شنبه" : "دوشنبه")
    )
    expect(formatted).toBe("شنبه، دوشنبه (17:00 - 18:30)")
  })

  it("detects teacher conflict with another class in the same term", () => {
    const conflict = findTeacherScheduleConflict(
      mockTeacher2,
      {
        daysOfWeek: ["SATURDAY"],
        sessionDates: ["2026-09-26"],
        startTime: "17:30",
        endTime: "19:00",
      },
      [otherTermClass],
      "class-editing"
    )
    expect(conflict).not.toBeNull()
    expect(conflict?.type).toBe("TEACHER_CLASS")
    if (conflict?.type === "TEACHER_CLASS") {
      expect(conflict.conflictingClass.id).toBe("class-other")
    }
  })

  it("detects teacher free-time violation when class time is outside availabilities", () => {
    const conflict = findTeacherScheduleConflict(
      mockTeacher1,
      {
        daysOfWeek: ["SUNDAY"],
        sessionDates: [],
        startTime: "17:00",
        endTime: "18:30",
      },
      [],
      "class-editing"
    )
    expect(conflict).not.toBeNull()
    expect(conflict?.type).toBe("TEACHER_FREE_TIME")
  })

  it("detects classroom conflict with another class at overlapping time", () => {
    const conflict = findClassroomScheduleConflict(
      "room-busy",
      {
        daysOfWeek: ["SATURDAY"],
        sessionDates: ["2026-09-26"],
        startTime: "17:00",
        endTime: "18:30",
      },
      [otherTermClass],
      "class-editing"
    )
    expect(conflict).not.toBeNull()
    expect(conflict?.conflictingClass.title).toBe("Top Notch 2B")
  })

  it("computes local schedule conflicts and occupiedDateReasons map", () => {
    const analysis = computeLocalScheduleConflicts({
      term: mockTerm,
      termClasses: [otherTermClass],
      teacher: mockTeacher2,
      teacherId: "teacher-2",
      teacherName: "سارا رضایی",
      classroomId: "room-busy",
      startTime: "17:00",
      endTime: "18:30",
      daysOfWeek: ["SATURDAY"],
      sessionDates: ["2026-09-26"],
      excludeClassId: "class-editing",
      formatClassroomConflictMessage: (c) => `Room busy with ${c}`,
      formatTeacherConflictMessage: (c) => `Teacher busy with ${c}`,
      formatTeacherFreeTimeMessage: (t) => `Outside ${t} free time`,
    })
    expect(analysis.conflictResult?.hasConflict).toBe(true)
    expect(analysis.occupiedDateReasons.get("2026-09-26")).toContain(
      "Top Notch 2B"
    )
  })
})

describe("EditClassModal resource & schedule protection", () => {
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
      queryFn: async () => [mockTerm],
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

    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", { instituteId: "inst-1" }],
      queryFn: async () => [],
    } as any)

    vi.spyOn(classroomsResource.list, "toQuery").mockReturnValue({
      queryKey: ["classrooms", { instituteId: "inst-1" }],
      queryFn: async () => [
        {
          id: "room-free",
          instituteId: "inst-1",
          branchId: null,
          name: "اتاق ۱۰۱",
          capacity: 20,
          description: null,
          isActive: true,
          classesCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "room-busy",
          instituteId: "inst-1",
          branchId: null,
          name: "اتاق ۱۰۲",
          capacity: 15,
          description: null,
          isActive: true,
          classesCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    vi.spyOn(teachersResource.list, "toQuery").mockReturnValue({
      queryKey: ["teachers", { instituteId: "inst-1", isActive: true }],
      queryFn: async () => [mockTeacher1, mockTeacher2],
    } as any)

    vi.spyOn(classesResource.list, "toQuery").mockReturnValue({
      queryKey: ["classes", { instituteId: "inst-1", termId: "term-1" }],
      queryFn: async () => [otherTermClass],
    } as any)
  })

  it("populates fallback schedule text when cls.schedule is null and formats classroom capacity properly", async () => {
    const editingClass: ClassDto = {
      id: "class-editing",
      instituteId: "inst-1",
      termId: "term-1",
      courseId: "course-1",
      branchId: null,
      classroomId: "room-free",
      title: "Top Notch 1A - G1",
      capacity: 15,
      enrolledCount: 0,
      fee: 1500000,
      teacherId: "teacher-1",
      teacherName: "مریم احمدی",
      schedule: null,
      daysOfWeek: ["SATURDAY"],
      sessionDates: ["2026-09-26"],
      startTime: "17:00",
      endTime: "18:30",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    render(<EditClassModal cls={editingClass} open={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/شنبه \(17:00 - 18:30\)/i)).toBeInTheDocument()
      expect(
        screen.getByText(/اتاق ۱۰۱ \(گنجایش: [20۲۰]+ نفر\)/i)
      ).toBeInTheDocument()
    })
  })
})
