import { describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../../../../test/test-utils"
import type { SchedulingNewTeacherHiringPlan as HiringPlan } from "@workspace/types"
import { schedulingResource } from "@/lib/api/resources/scheduling.resource"
import { SchedulingNewTeacherHiringPlan } from "../components/scheduling-new-teacher-hiring-plan"

describe("SchedulingNewTeacherHiringPlan Component", () => {
  const mockPlan: HiringPlan = {
    daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
    startTime: "14:00",
    endTime: "15:30",
    totalClassCount: 1,
    requiredCourses: [
      { id: "c1111111-1111-4111-8111-111111111111", title: "AME 1-3" },
    ],
    coversAllUnresolvedClasses: true,
    usesPreferredThreeDayPattern: true,
    hasConsecutiveTimes: true,
    assignments: [
      {
        key: "req-1#1",
        requirementId: "r1111111-1111-4111-8111-111111111111",
        course: {
          id: "c1111111-1111-4111-8111-111111111111",
          title: "AME 1-3",
        },
        classNumber: 1,
        deliveryMode: "IN_PERSON",
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "14:00",
        endTime: "15:30",
        classroom: {
          id: "rm111111-1111-4111-8111-111111111111",
          name: "کلاس C",
          capacity: 15,
        },
      },
    ],
    availableTimeSlots: [
      {
        key: "SUNDAY,TUESDAY,THURSDAY|14:00|15:30",
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "14:00",
        endTime: "15:30",
        isFullyBooked: false,
        availableClassrooms: [
          {
            id: "rm111111-1111-4111-8111-111111111111",
            name: "کلاس C",
            capacity: 15,
          },
        ],
      },
      {
        key: "SATURDAY,MONDAY,WEDNESDAY|14:00|15:30",
        daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
        startTime: "14:00",
        endTime: "15:30",
        isFullyBooked: false,
        availableClassrooms: [
          {
            id: "rm222222-2222-4222-8222-222222222222",
            name: "کلاس B",
            capacity: 15,
          },
        ],
      },
      {
        key: "SUNDAY,TUESDAY,THURSDAY|15:30|17:00",
        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
        startTime: "15:30",
        endTime: "17:00",
        isFullyBooked: true,
        availableClassrooms: [],
      },
    ],
  }

  it("renders the hiring plan details, courses, and time slots", () => {
    render(
      <SchedulingNewTeacherHiringPlan
        plan={mockPlan}
        missingClassCount={1}
        planId="plan-123"
        planStatus="DRAFT"
      />
    )

    expect(
      screen.getByText("برنامه پیشنهادی برای جذب استاد جدید")
    ).toBeInTheDocument()
    expect(screen.getByText("AME 1-3")).toBeInTheDocument()
    expect(screen.getByText("ثبت کلاس‌های پیش‌نویس برنامه")).toBeInTheDocument()
    expect(
      screen.queryByText(/SUNDAY,TUESDAY,THURSDAY/)
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByText(/یکشنبه، سه‌شنبه، پنجشنبه/).length
    ).toBeGreaterThanOrEqual(1)
  })

  it("calls commitHiringPlan when the commit button is clicked", async () => {
    const mutateSpy = vi.fn()
    vi.spyOn(schedulingResource.commitHiringPlan, "toMutation").mockReturnValue(
      {
        mutationFn: mutateSpy,
      } as any
    )

    render(
      <SchedulingNewTeacherHiringPlan
        plan={mockPlan}
        missingClassCount={1}
        planId="plan-123"
        planStatus="DRAFT"
      />
    )

    const commitButton = screen.getByRole("button", {
      name: /ثبت کلاس‌های پیش‌نویس برنامه/,
    })
    fireEvent.click(commitButton)

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: "plan-123",
          body: {
            assignments: [
              expect.objectContaining({
                key: "req-1#1",
                classNumber: 1,
                requirementId: "r1111111-1111-4111-8111-111111111111",
                courseId: "c1111111-1111-4111-8111-111111111111",
                daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
                startTime: "14:00",
                endTime: "15:30",
              }),
            ],
          },
        }),
        expect.any(Object)
      )
    })
  })

  it("renders empty state when plan is null", () => {
    render(
      <SchedulingNewTeacherHiringPlan
        plan={null}
        missingClassCount={2}
        planId="plan-123"
        planStatus="DRAFT"
      />
    )

    expect(
      screen.getByText("برنامه قابل اجرای کاملی پیدا نشد")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /ثبت/ })
    ).not.toBeInTheDocument()
  })
})
