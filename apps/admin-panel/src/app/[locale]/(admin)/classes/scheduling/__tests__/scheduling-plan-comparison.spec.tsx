import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../../../../test/test-utils"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { schedulingResource } from "@/lib/api"
import * as stores from "@/lib/stores"
import { SchedulingNewTeacherAssignmentList } from "../components/scheduling-new-teacher-assignment-list"
import { SchedulingNewTeacherHiringPlan } from "../components/scheduling-new-teacher-hiring-plan"
import { SchedulingPlanComparison } from "../components/scheduling-plan-comparison"

const mockPush = vi.fn()

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/scheduling",
  useIsRtl: () => true,
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const instituteId = "11111111-1111-4111-8111-111111111111"
const firstPlanId = "22222222-2222-4222-8222-222222222222"
const secondPlanId = "33333333-3333-4333-8333-333333333333"
const runId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const timestamp = "2026-09-09T10:00:00.000Z"

const plan = (
  id: string,
  rank: number,
  overrides: Partial<SchedulingPlanDetailsDto> = {}
) =>
  ({
    id,
    instituteId,
    runId,
    status: "DRAFT",
    rank,
    isRecommended: false,
    qualityIndex: 84,
    earnedWeightedPoints: 63,
    applicableWeightedPoints: 75,
    coveragePercent: 91,
    minimumCourseCoveragePercent: 82,
    scoreBreakdown: {
      criteria: [
        {
          code: "SC_TIME_PATTERN_DIVERSITY",
          status: "APPLICABLE",
          rawValue: 0.8,
          normalizedScore: 0.8,
          weight: 25,
          weightedPoints: 20,
          details: {},
        },
      ],
    },
    generatedAt: timestamp,
    warnings: [
      {
        code: "MISSING_SCHEDULED_CLASSES",
        severity: "WARNING",
        scope: "REQUIREMENT",
        context: { requiredClassCount: 2, scheduledClassCount: 1 },
      },
    ],
    proposals: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        title: "کلاس سطح A2",
        course: { id: "55555555-5555-4555-8555-555555555555", title: "A2" },
        teacher: {
          id: "66666666-6666-4666-8666-666666666666",
          firstName: "سارا",
          lastName: "احمدی",
        },
        branch: { id: "77777777-7777-4777-8777-777777777777", name: "مرکزی" },
        classroom: {
          id: "88888888-8888-4888-8888-888888888888",
          name: "کلاس ۳",
          capacity: 15,
        },
        deliveryMode: "IN_PERSON",
        daysOfWeek: ["SATURDAY", "MONDAY"],
        startTime: "09:00",
        endTime: "10:30",
        capacity: 12,
        sessions: [{ id: "99999999-9999-4999-8999-999999999999" }],
        warnings: [
          {
            code: "MANUAL_EDIT_REQUIRES_VALIDATION",
            severity: "WARNING",
            scope: "PROPOSAL",
            context: { changedFields: ["teacherId"] },
          },
        ],
        isLocked: false,
        isManuallyEdited: false,
        selectionReasons: [
          { code: "MATCHES_TEACHER_AVAILABILITY", evidence: {} },
        ],
      },
    ],
    teacherCalendars: [
      {
        teacher: {
          id: "66666666-6666-4666-8666-666666666666",
          firstName: "سارا",
          lastName: "احمدی",
        },
        teachableCourses: [
          {
            id: "51515151-5151-4515-8515-515151515151",
            title: "AME 1",
          },
        ],
        slots: [
          {
            dayOfWeek: "SUNDAY",
            startTime: "09:00",
            endTime: "10:30",
            status: "BUSY",
            title: "کلاس سطح A2",
            source: "PLAN",
          },
          {
            dayOfWeek: "SUNDAY",
            startTime: "10:30",
            endTime: "13:30",
            status: "FREE",
            title: null,
            source: "AVAILABILITY",
          },
        ],
      },
      {
        teacher: {
          id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          firstName: "رضا",
          lastName: "کریمی",
        },
        teachableCourses: [
          {
            id: "52525252-5252-4525-8525-525252525252",
            title: "AME 4",
          },
          {
            id: "53535353-5353-4535-8535-535353535353",
            title: "AME 5",
          },
        ],
        slots: [
          {
            dayOfWeek: "MONDAY",
            startTime: "14:00",
            endTime: "15:30",
            status: "BUSY",
            title: "کلاس عمومی رضا",
            source: "PLAN",
          },
        ],
      },
    ],
    newTeacherHiringPlan: null,
    unresolvedRequirements: [],
    run: {
      term: { title: "پاییز" },
      branch: null,
    },
    ...overrides,
  }) as SchedulingPlanDetailsDto

describe("MVP-036 scheduling plan comparison", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mockPush.mockReset()
  })

  it("loads every plan, sorts by rank, and keeps the choice neutral", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    const detailSpy = vi
      .spyOn(schedulingResource.planDetail, "toQuery")
      .mockImplementation(({ planId }) => ({
        queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
        queryFn: async () =>
          planId === firstPlanId
            ? plan(firstPlanId, 2, { qualityIndex: 78 })
            : plan(secondPlanId, 1, {
                qualityIndex: 92,
                unresolvedRequirements: [
                  { missingClassCount: 2 },
                ] as SchedulingPlanDetailsDto["unresolvedRequirements"],
              }),
      }))

    render(<SchedulingPlanComparison planIds={[firstPlanId, secondPlanId]} />)

    expect(
      await screen.findByRole("heading", { name: "برنامه ۱" })
    ).toBeInTheDocument()
    expect(
      screen
        .getAllByRole("heading", { level: 3 })
        .map((item) => item.textContent)
    ).toEqual(["برنامه ۱", "برنامه ۲"])
    expect(screen.getAllByRole("row")).toHaveLength(3)
    expect(screen.queryByText("پیشنهاد موتور")).not.toBeInTheDocument()
    const missingClassBadges = screen.getAllByText("۲ کلاس تأمین‌نشده")
    expect(missingClassBadges).toHaveLength(2)
    missingClassBadges.forEach((badge) =>
      expect(badge).toHaveClass("text-warning-foreground")
    )
    expect(detailSpy).toHaveBeenCalledWith({
      planId: firstPlanId,
      instituteId,
    })
    expect(detailSpy).toHaveBeenCalledWith({
      planId: secondPlanId,
      instituteId,
    })
  })

  it("offers a recoverable state when plan details cannot be loaded", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({
        planId: firstPlanId,
        instituteId,
      }),
      queryFn: async () => Promise.reject(new Error("offline")),
    } as never)

    render(<SchedulingPlanComparison planIds={[firstPlanId]} />)

    expect(
      await screen.findByText("مقایسه برنامه‌ها بارگذاری نشد")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "تلاش دوباره" })
    ).toBeInTheDocument()
  })

  it("navigates to the dedicated plan details page when clicking view details", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({
        planId: firstPlanId,
        instituteId,
      }),
      queryFn: async () =>
        plan(firstPlanId, 1, {
          newTeacherHiringPlan: {
            daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
            startTime: "14:00",
            endTime: "18:30",
            totalClassCount: 3,
            requiredCourses: [
              {
                id: "51515151-5151-4515-8515-515151515151",
                title: "AME 5",
              },
              {
                id: "52525252-5252-4525-8525-525252525252",
                title: "AME 3-5",
              },
            ],
            assignments: [
              {
                key: "ame-5:1",
                requirementId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                course: {
                  id: "51515151-5151-4515-8515-515151515151",
                  title: "AME 5",
                },
                classNumber: 1,
                deliveryMode: "IN_PERSON",
                daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
                startTime: "14:00",
                endTime: "15:30",
                classroom: {
                  id: "88888888-8888-4888-8888-888888888888",
                  name: "کلاس ۳",
                  capacity: 15,
                },
              },
              {
                key: "ame-5:2",
                requirementId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                course: {
                  id: "51515151-5151-4515-8515-515151515151",
                  title: "AME 5",
                },
                classNumber: 2,
                deliveryMode: "IN_PERSON",
                daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
                startTime: "15:30",
                endTime: "17:00",
                classroom: {
                  id: "88888888-8888-4888-8888-888888888888",
                  name: "کلاس ۳",
                  capacity: 15,
                },
              },
              {
                key: "ame-3-5:1",
                requirementId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
                course: {
                  id: "52525252-5252-4525-8525-525252525252",
                  title: "AME 3-5",
                },
                classNumber: 1,
                deliveryMode: "IN_PERSON",
                daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
                startTime: "17:00",
                endTime: "18:30",
                classroom: null,
              },
            ],
            coversAllUnresolvedClasses: true,
            usesPreferredThreeDayPattern: true,
            hasConsecutiveTimes: true,
          },
          unresolvedRequirements: [
            {
              id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              reasonCode: "PLAN_COMBINATION_CONFLICT",
              missingClassCount: 2,
              classRequirement: {
                id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                course: { title: "AME 5" },
              },
              recovery: {
                totalOptionCount: 2,
                qualifiedTeacherCount: 1,
                compatibleClassroomCount: 2,
                busyTeachers: [],
                teacherCalendars: [
                  {
                    teacher: {
                      id: "66666666-6666-4666-8666-666666666666",
                      firstName: "سارا",
                      lastName: "احمدی",
                    },
                    slots: [
                      {
                        dayOfWeek: "SUNDAY",
                        startTime: "09:00",
                        endTime: "10:30",
                        status: "BUSY",
                        title: "AME 3-2",
                        source: "PLAN",
                      },
                      {
                        dayOfWeek: "SUNDAY",
                        startTime: "10:30",
                        endTime: "13:30",
                        status: "FREE",
                        title: null,
                        source: "AVAILABILITY",
                      },
                    ],
                  },
                  {
                    teacher: {
                      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                      firstName: "رضا",
                      lastName: "کریمی",
                    },
                    slots: [
                      {
                        dayOfWeek: "SATURDAY",
                        startTime: "14:00",
                        endTime: "15:30",
                        status: "BUSY",
                        title: "AME 2",
                        source: "PLAN",
                      },
                      {
                        dayOfWeek: "SATURDAY",
                        startTime: "15:30",
                        endTime: "18:00",
                        status: "FREE",
                        title: null,
                        source: "AVAILABILITY",
                      },
                    ],
                  },
                ],
                reassignmentChains: [
                  {
                    key: "ame-5-reassignment-chain",
                    targetAssignment: {
                      teacher: {
                        id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                        firstName: "رضا",
                        lastName: "کریمی",
                      },
                      classroom: {
                        id: "88888888-8888-4888-8888-888888888888",
                        name: "کلاس ۳",
                        capacity: 15,
                      },
                      deliveryMode: "IN_PERSON",
                      daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
                      startTime: "14:00",
                      endTime: "15:30",
                    },
                    reassignments: [
                      {
                        proposalId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
                        classTitle: "AME 1",
                        courseId: "12121212-1212-4212-8212-121212121212",
                        fromTeacher: {
                          id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                          firstName: "رضا",
                          lastName: "کریمی",
                        },
                        toTeacher: {
                          id: "66666666-6666-4666-8666-666666666666",
                          firstName: "سارا",
                          lastName: "احمدی",
                        },
                        daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
                        startTime: "14:00",
                        endTime: "15:30",
                      },
                    ],
                    validation: {
                      allTeachersQualified: true,
                      allWithinAvailability: true,
                      noTeacherConflicts: true,
                      targetClassroomAvailable: true,
                    },
                  },
                ],
                staffingFallback: {
                  addTeacherSuggested: true,
                  availabilityOptions: [],
                },
                options: [
                  {
                    key: "ame-5-sara-sunday-1030",
                    status: "AVAILABLE_NOW",
                    deliveryMode: "IN_PERSON",
                    daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
                    startTime: "10:30",
                    endTime: "12:00",
                    teacher: {
                      id: "66666666-6666-4666-8666-666666666666",
                      firstName: "سارا",
                      lastName: "احمدی",
                    },
                    availableClassrooms: [
                      {
                        id: "88888888-8888-4888-8888-888888888888",
                        name: "کلاس ۳",
                        capacity: 15,
                      },
                    ],
                    blockingClasses: [],
                  },
                  {
                    key: "ame-5-reza-sunday-1530",
                    status: "REQUIRES_PLAN_CHANGE",
                    deliveryMode: "IN_PERSON",
                    daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
                    startTime: "15:30",
                    endTime: "17:00",
                    teacher: {
                      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                      firstName: "رضا",
                      lastName: "کریمی",
                    },
                    availableClassrooms: [],
                    blockingClasses: [
                      {
                        id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
                        title: "AME 3-2",
                        conflictTypes: ["CLASSROOM"],
                        classroom: {
                          id: "abababab-abab-4aba-8aba-abababababab",
                          name: "کلاس ۱",
                          capacity: 15,
                        },
                      },
                    ],
                  },
                ],
              },
            },
            {
              id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
              reasonCode: "TEACHER_TIME_CONFLICT",
              missingClassCount: 1,
              classRequirement: {
                id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
                course: { title: "AME 3-5" },
              },
              recovery: {
                totalOptionCount: 0,
                qualifiedTeacherCount: 1,
                compatibleClassroomCount: 2,
                options: [],
                busyTeachers: [
                  {
                    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                    firstName: "دکتر بهنام",
                    lastName: "مرادی",
                  },
                ],
                teacherCalendars: [
                  {
                    teacher: {
                      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                      firstName: "دکتر بهنام",
                      lastName: "مرادی",
                    },
                    slots: [
                      {
                        dayOfWeek: "SUNDAY",
                        startTime: "15:30",
                        endTime: "17:00",
                        status: "BUSY",
                        title: "AME 1",
                        source: "PLAN",
                      },
                    ],
                  },
                ],
                reassignmentChains: [],
                staffingFallback: {
                  addTeacherSuggested: true,
                  availabilityOptions: [
                    {
                      key: "ame-3-5-behnam-sunday-1730",
                      deliveryMode: "IN_PERSON",
                      daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
                      startTime: "17:30",
                      endTime: "19:00",
                      teacher: {
                        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                        firstName: "دکتر بهنام",
                        lastName: "مرادی",
                      },
                      availabilityChangeDays: ["SUNDAY", "TUESDAY", "THURSDAY"],
                      availableClassrooms: [
                        {
                          id: "88888888-8888-4888-8888-888888888888",
                          name: "کلاس ۳",
                          capacity: 15,
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ] as SchedulingPlanDetailsDto["unresolvedRequirements"],
        }),
    } as never)

    render(<SchedulingPlanComparison planIds={[firstPlanId]} />)

    const detailsButtons = await screen.findAllByRole("button", {
      name: "مشاهده جزئیات",
    })
    fireEvent.click(detailsButtons[0]!)

    expect(mockPush).toHaveBeenCalledWith(`/scheduling/plans/${firstPlanId}`)
  })

  it("calls custom onViewDetails callback when provided", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({
        planId: firstPlanId,
        instituteId,
      }),
      queryFn: async () => plan(firstPlanId, 1),
    } as never)

    const handleView = vi.fn()
    render(
      <SchedulingPlanComparison
        planIds={[firstPlanId]}
        onViewDetails={handleView}
      />
    )

    const detailsButtons = await screen.findAllByRole("button", {
      name: "مشاهده جزئیات",
    })
    fireEvent.click(detailsButtons[0]!)

    expect(handleView).toHaveBeenCalledWith(firstPlanId)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("selects one plan at a time and replaces the previous selection", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockImplementation(
      ({ planId }) => ({
        queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
        queryFn: async () =>
          planId === firstPlanId ? plan(firstPlanId, 2) : plan(secondPlanId, 1),
      })
    )
    const select = vi.fn(async ({ planId }: { planId: string }) => ({
      planId,
      runId,
      status: "SELECTED" as const,
      selectedAt: timestamp,
    }))
    vi.spyOn(schedulingResource.selectPlan, "toMutation").mockReturnValue({
      mutationFn: select,
    })

    render(<SchedulingPlanComparison planIds={[firstPlanId, secondPlanId]} />)

    const initialButtons = await screen.findAllByRole("button", {
      name: "انتخاب این برنامه",
    })
    fireEvent.click(initialButtons[0]!)

    await waitFor(() => {
      const selectedButtons = screen.getAllByRole("button", {
        name: "برنامه انتخاب‌شده",
      })
      expect(selectedButtons.length).toBeGreaterThan(0)
      selectedButtons.forEach((button) => expect(button).toBeDisabled())
    })

    fireEvent.click(
      screen.getAllByRole("button", { name: "انتخاب این برنامه" })[0]!
    )

    await waitFor(() => expect(select).toHaveBeenCalledTimes(2))
    expect(select).toHaveBeenNthCalledWith(
      1,
      {
        planId: secondPlanId,
        instituteId,
      },
      expect.any(Object)
    )
    expect(select).toHaveBeenNthCalledWith(
      2,
      {
        planId: firstPlanId,
        instituteId,
      },
      expect.any(Object)
    )
  })

  it("keeps the new-teacher recommendation visible when no consolidated window exists", () => {
    render(<SchedulingNewTeacherHiringPlan plan={null} missingClassCount={3} />)

    expect(
      screen.getByText("برنامه پیشنهادی برای جذب استاد جدید")
    ).toBeInTheDocument()
    expect(screen.getByText("۳ کلاس")).toBeInTheDocument()
    expect(
      screen.getByText("برنامه قابل اجرای کاملی پیدا نشد")
    ).toBeInTheDocument()
    expect(
      screen.getByText(/افزودن استاد جدید همچنان پیشنهاد می‌شود/)
    ).toBeInTheDocument()
  })

  it("shows an explicit empty state when no exact new-teacher time exists", () => {
    render(<SchedulingNewTeacherAssignmentList assignments={[]} />)

    expect(
      screen.getByText("زمان دقیق برای این کلاس پیدا نشد")
    ).toBeInTheDocument()
    expect(
      screen.getByText(/پیشنهاد افزودن استاد جدید حذف نشده است/)
    ).toBeInTheDocument()
  })
})
