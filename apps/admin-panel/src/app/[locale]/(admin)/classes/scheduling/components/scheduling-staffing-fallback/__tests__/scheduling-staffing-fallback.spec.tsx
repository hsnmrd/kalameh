import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/test-utils"
import { SchedulingStaffingFallback } from "../index"
import type { SchedulingStaffingFallback as StaffingFallbackDto } from "@workspace/types"

describe("SchedulingStaffingFallback", () => {
  const mockFallback: StaffingFallbackDto = {
    addTeacherSuggested: true,
    availabilityOptions: [],
  }

  const mockAssignments = [
    {
      key: "slot-1",
      requirementId: "req-1",
      deliveryMode: "IN_PERSON" as const,
      daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startTime: "15:00",
      endTime: "16:30",
      classroom: null,
      suggestedTeacher: null,
    },
    {
      key: "slot-2",
      requirementId: "req-1",
      deliveryMode: "IN_PERSON" as const,
      daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
      startTime: "16:30",
      endTime: "18:00",
      classroom: null,
      suggestedTeacher: null,
    },
  ]

  it("renders RequiredScheduleCard with days and clock badges when no teachers are available in the bank", () => {
    render(
      <SchedulingStaffingFallback
        fallback={mockFallback}
        targetCourseTitle="AME 5-5"
        hiringAssignments={mockAssignments}
        unavailableTeachers={[]}
      />
    )

    // Should NOT show the teacher bank calling UI
    expect(screen.queryByText("بانک اساتید")).not.toBeInTheDocument()
    expect(
      screen.queryByText("استادان نیازمند تماس (عدم حضور در این بازه)")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        "استادان زیر در بانک آموزشگاه برای این دوره ثبت شده‌اند اما در حال حاضر زمان حضور فعالی در این بازه ندارند؛ جهت هماهنگی می‌توانید با آن‌ها تماس بگیرید."
      )
    ).not.toBeInTheDocument()

    // Should show the new schedule structure with days and times
    expect(screen.getByText("زمان کلاس")).toBeInTheDocument()
    expect(
      screen.getByText("زمان‌های مورد نیاز برای تشکیل کلاس")
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "برای تشکیل این کلاس، نیاز به هماهنگی یا جذب استادی با زمان حضور در روزها و ساعت‌های زیر است:"
      )
    ).toBeInTheDocument()

    // Should render the days and clock badges
    expect(
      screen.getByText(
        (content) =>
          content.includes("یکشنبه، سه‌شنبه، پنجشنبه") &&
          content.includes("15:00")
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (content) =>
          content.includes("یکشنبه، سه‌شنبه، پنجشنبه") &&
          content.includes("18:00")
      )
    ).toBeInTheDocument()
  })

  it("renders TeacherBankOutreach when teachers are present in unavailableTeachers", () => {
    const mockTeachers = [
      {
        id: "teacher-1",
        firstName: "علی",
        lastName: "احمدی",
        avatarUrl: null,
      },
    ]

    render(
      <SchedulingStaffingFallback
        fallback={mockFallback}
        targetCourseTitle="AME 5-5"
        hiringAssignments={mockAssignments}
        unavailableTeachers={mockTeachers}
      />
    )

    // Should show the teacher bank calling UI
    expect(screen.getByText("بانک اساتید")).toBeInTheDocument()
    expect(
      screen.getByText("استادان نیازمند تماس (عدم حضور در این بازه)")
    ).toBeInTheDocument()
    expect(screen.getByText("علی احمدی")).toBeInTheDocument()
    expect(screen.getByText("نیازمند تماس")).toBeInTheDocument()

    // Should NOT show the standalone RequiredScheduleCard header
    expect(screen.queryByText("زمان کلاس")).not.toBeInTheDocument()
  })

  it("renders nothing in the bottom card if both unavailableTeachers and hiringAssignments are empty", () => {
    render(
      <SchedulingStaffingFallback
        fallback={mockFallback}
        targetCourseTitle="AME 5-5"
        hiringAssignments={[]}
        unavailableTeachers={[]}
      />
    )

    expect(screen.queryByText("بانک اساتید")).not.toBeInTheDocument()
    expect(screen.queryByText("زمان کلاس")).not.toBeInTheDocument()
  })
})
