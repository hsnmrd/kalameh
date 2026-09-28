import { describe, expect, it } from "vitest"
import type { ClassDto, TeacherDto } from "@workspace/types"
import { buildTeacherCalendars } from "../helper/build-teacher-calendars"

describe("buildTeacherCalendars", () => {
  const mockTeacher: TeacherDto = {
    id: "teacher-1",
    instituteId: "inst-1",
    role: "TEACHER",
    firstName: "علی",
    lastName: "محمدی",
    phone: "09123456789",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    teacherProfile: {
      id: "profile-1",
      userId: "teacher-1",
      bio: null,
      degree: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      availabilities: [
        {
          id: "avail-1",
          dayOfWeek: "SATURDAY",
          startTime: "08:00",
          endTime: "13:00",
        },
        {
          id: "avail-2",
          dayOfWeek: "MONDAY",
          startTime: "14:00",
          endTime: "18:00",
        },
      ],
      teachableCourses: [
        {
          course: {
            id: "course-1",
            title: "English Level 1",
          },
        },
      ],
    },
  }

  const mockClass: ClassDto = {
    id: "class-1",
    instituteId: "inst-1",
    termId: "term-1",
    courseId: "course-1",
    title: "کلاس انگلیسی صبح شنبه",
    capacity: 15,
    fee: 1000000,
    teacherId: "teacher-1",
    daysOfWeek: ["SATURDAY"],
    sessionDates: [],
    startTime: "09:00",
    endTime: "11:00",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it("correctly identifies busy classes and remaining free time", () => {
    const calendars = buildTeacherCalendars([mockTeacher], [mockClass])

    expect(calendars).toHaveLength(1)
    const cal = calendars[0]!
    expect(cal.teacher.id).toBe("teacher-1")
    expect(cal.teacher.firstName).toBe("علی")
    expect(cal.teachableCourses).toHaveLength(1)
    expect(cal.teachableCourses[0]?.title).toBe("English Level 1")

    // Saturday slots:
    // 08:00 - 09:00 (FREE)
    // 09:00 - 11:00 (BUSY, "کلاس انگلیسی صبح شنبه")
    // 11:00 - 13:00 (FREE)
    const satSlots = cal.slots.filter((s) => s.dayOfWeek === "SATURDAY")
    expect(satSlots).toHaveLength(3)

    expect(satSlots[0]).toMatchObject({
      startTime: "08:00",
      endTime: "09:00",
      status: "FREE",
    })
    expect(satSlots[1]).toMatchObject({
      startTime: "09:00",
      endTime: "11:00",
      status: "BUSY",
      title: "کلاس انگلیسی صبح شنبه",
    })
    expect(satSlots[2]).toMatchObject({
      startTime: "11:00",
      endTime: "13:00",
      status: "FREE",
    })

    // Monday slots: fully free from 14:00 to 18:00
    const monSlots = cal.slots.filter((s) => s.dayOfWeek === "MONDAY")
    expect(monSlots).toHaveLength(1)
    expect(monSlots[0]).toMatchObject({
      startTime: "14:00",
      endTime: "18:00",
      status: "FREE",
    })
  })

  it("handles teachers with no assigned classes (all availability is free)", () => {
    const calendars = buildTeacherCalendars([mockTeacher], [])
    expect(calendars).toHaveLength(1)

    const cal = calendars[0]!
    expect(cal.slots.every((s) => s.status === "FREE")).toBe(true)
    expect(cal.slots).toHaveLength(2)
  })

  it("handles teachers with no declared availability but assigned classes", () => {
    const teacherWithoutAvail: TeacherDto = {
      ...mockTeacher,
      id: "teacher-2",
      teacherProfile: {
        ...mockTeacher.teacherProfile!,
        availabilities: [],
      },
    }
    const classForTeacher2: ClassDto = {
      ...mockClass,
      id: "class-2",
      teacherId: "teacher-2",
    }

    const calendars = buildTeacherCalendars(
      [teacherWithoutAvail],
      [classForTeacher2]
    )
    expect(calendars).toHaveLength(1)

    const cal = calendars[0]!
    expect(cal.slots).toHaveLength(1)
    expect(cal.slots[0]).toMatchObject({
      status: "BUSY",
      startTime: "09:00",
      endTime: "11:00",
    })
  })
})
