import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useCreateBranchSchema } from "../app/[locale]/(admin)/branches/hooks/use-branch-schemas"
import { useCreateClassSchema } from "../app/[locale]/(admin)/classes/hooks/use-class-schemas"
import { useCreateClassroomSchema } from "../app/[locale]/(admin)/classrooms/hooks/use-classroom-schemas"
import { useCreateCourseSchema } from "../app/[locale]/(admin)/courses/hooks/use-course-schemas"
import { useCreateTeacherSchema } from "../app/[locale]/(admin)/teachers/hooks/use-teacher-schemas"
import { useCreateTermSchema } from "../app/[locale]/(admin)/terms/hooks/use-term-schemas"
import { useCreateInstituteCustomOffDaySchema } from "../app/[locale]/(admin)/calendar/hooks/use-calendar-schemas"
import { NextIntlClientProvider } from "next-intl"
import branchesFa from "../messages/fa/branches.json"
import classesFa from "../messages/fa/classes.json"
import classroomsFa from "../messages/fa/classrooms.json"
import coursesFa from "../messages/fa/courses.json"
import teachersFa from "../messages/fa/teachers.json"
import termsFa from "../messages/fa/terms.json"
import settingFa from "../messages/fa/setting.json"

const messages = {
  branches: branchesFa,
  classes: classesFa,
  classrooms: classroomsFa,
  courses: coursesFa,
  teachers: teachersFa,
  terms: termsFa,
  setting: settingFa,
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="fa" messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

describe("Form Validation Schemas Localization (i18n)", () => {
  it("branches: returns localized Persian error when name is too short", () => {
    const { result } = renderHook(() => useCreateBranchSchema(), { wrapper })
    const parseResult = result.current.safeParse({ name: "ا" })
    expect(parseResult.success).toBe(false)
    if (!parseResult.success) {
      const issue = parseResult.error.issues.find((i) => i.path[0] === "name")
      expect(issue?.message).toBe("نام شعبه باید حداقل ۲ کاراکتر باشد.")
    }
  })

  it("classes: returns localized Persian errors for required fields", () => {
    const { result } = renderHook(() => useCreateClassSchema(), { wrapper })
    const parseResult = result.current.safeParse({
      title: "ک",
      termId: "invalid-uuid",
      courseId: "invalid-uuid",
      capacity: 0,
      fee: -100,
    })
    expect(parseResult.success).toBe(false)
    if (!parseResult.success) {
      const titleIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "title"
      )
      expect(titleIssue?.message).toBe("عنوان کلاس باید حداقل ۲ کاراکتر باشد.")

      const termIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "termId"
      )
      expect(termIssue?.message).toBe("انتخاب ترم تحصیلی الزامی است.")

      const courseIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "courseId"
      )
      expect(courseIssue?.message).toBe("انتخاب سطح آموزشی الزامی است.")

      const capacityIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "capacity"
      )
      expect(capacityIssue?.message).toBe("ظرفیت کلاس باید حداقل ۱ نفر باشد.")

      const feeIssue = parseResult.error.issues.find((i) => i.path[0] === "fee")
      expect(feeIssue?.message).toBe("شهریه کلاس نمی‌تواند منفی باشد.")
    }
  })

  it("classrooms: returns localized Persian errors for name and capacity", () => {
    const { result } = renderHook(() => useCreateClassroomSchema(), { wrapper })
    const parseResult = result.current.safeParse({
      name: "ک",
      capacity: 0,
      branchId: "invalid-uuid",
    })
    expect(parseResult.success).toBe(false)
    if (!parseResult.success) {
      const nameIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "name"
      )
      expect(nameIssue?.message).toBe("نام کلاس درس باید حداقل ۲ کاراکتر باشد.")

      const capacityIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "capacity"
      )
      expect(capacityIssue?.message).toBe(
        "ظرفیت کلاس درس باید حداقل ۱ نفر باشد."
      )

      const branchIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "branchId"
      )
      expect(branchIssue?.message).toBe("انتخاب شعبه الزامی است.")
    }
  })

  it("courses: returns localized Persian errors for title and fee", () => {
    const { result } = renderHook(() => useCreateCourseSchema(), { wrapper })
    const parseResult = result.current.safeParse({
      title: "د",
      baseFee: -10,
    })
    expect(parseResult.success).toBe(false)
    if (!parseResult.success) {
      const titleIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "title"
      )
      expect(titleIssue?.message).toBe("عنوان دوره باید حداقل ۲ کاراکتر باشد.")

      const feeIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "baseFee"
      )
      expect(feeIssue?.message).toBe("شهریه پایه نمی‌تواند منفی باشد.")
    }
  })

  it("teachers: returns localized Persian errors for name, phone, password", () => {
    const { result } = renderHook(() => useCreateTeacherSchema(), { wrapper })
    const parseResult = result.current.safeParse({
      firstName: "ع",
      lastName: "ر",
      phone: "12345",
      password: "123",
    })
    expect(parseResult.success).toBe(false)
    if (!parseResult.success) {
      const fnIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "firstName"
      )
      expect(fnIssue?.message).toBe("نام باید حداقل ۲ کاراکتر باشد.")

      const lnIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "lastName"
      )
      expect(lnIssue?.message).toBe("نام خانوادگی باید حداقل ۲ کاراکتر باشد.")

      const phoneIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "phone"
      )
      expect(phoneIssue?.message).toBe(
        "شماره تماس باید ۱۱ رقم و با ۰۹ شروع شود (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)."
      )

      const pwdIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "password"
      )
      expect(pwdIssue?.message).toBe("رمز عبور باید حداقل ۶ کاراکتر باشد.")
    }
  })

  it("terms: returns localized Persian errors for title and dates", () => {
    const { result } = renderHook(() => useCreateTermSchema(), { wrapper })
    const parseResult = result.current.safeParse({
      title: "ت",
      startDate: "",
      endDate: "",
      operatingPhaseId: "invalid-uuid",
    })
    expect(parseResult.success).toBe(false)
    if (!parseResult.success) {
      const titleIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "title"
      )
      expect(titleIssue?.message).toBe("عنوان ترم باید حداقل ۲ کاراکتر باشد.")

      const startIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "startDate"
      )
      expect(startIssue?.message).toBe("تاریخ شروع ترم الزامی است.")

      const endIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "endDate"
      )
      expect(endIssue?.message).toBe("تاریخ پایان ترم الزامی است.")

      const phaseIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "operatingPhaseId"
      )
      expect(phaseIssue?.message).toBe("انتخاب فاز تحصیلی الزامی است.")
    }
  })

  it("calendar: returns localized Persian error for custom off-day title", () => {
    const { result } = renderHook(
      () => useCreateInstituteCustomOffDaySchema(),
      { wrapper }
    )
    const parseResult = result.current.safeParse({
      title: "",
      date: "2026-10-14",
    })
    expect(parseResult.success).toBe(false)
    if (!parseResult.success) {
      const titleIssue = parseResult.error.issues.find(
        (i) => i.path[0] === "title"
      )
      expect(titleIssue?.message).toBe("عنوان تعطیلی الزامی است.")
    }
  })
})
