import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "../../../../../../../test/test-utils"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { schedulingResource } from "@/lib/api"
import * as stores from "@/lib/stores"
import SchedulingPlanDetailsPage from "../page"

const instituteId = "11111111-1111-4111-8111-111111111111"
const planId = "22222222-2222-4222-8222-222222222222"
const runId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const timestamp = "2026-09-09T10:00:00.000Z"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useParams: () => ({ planId }),
  useRouter: () => ({ push: mockPush }),
  usePathname: () => `/scheduling/plans/${planId}`,
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => `/scheduling/plans/${planId}`,
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

const createPlan = (
  id: string,
  rank: number,
  overrides: Partial<SchedulingPlanDetailsDto> = {}
): SchedulingPlanDetailsDto => ({
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
  unresolvedRequirements: [],
  proposals: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      instituteId,
      planId: id,
      courseId: "55555555-5555-4555-8555-555555555555",
      teacherId: "66666666-6666-4666-8666-666666666666",
      branchId: "77777777-7777-4777-8777-777777777777",
      classroomId: "88888888-8888-4888-8888-888888888888",
      title: "کلاس سطح A2",
      capacity: 15,
      deliveryMode: "IN_PERSON",
      daysOfWeek: ["SATURDAY", "MONDAY"],
      startTime: "09:00",
      endTime: "10:30",
      course: {
        id: "55555555-5555-4555-8555-555555555555",
        title: "A2",
      },
      teacher: {
        id: "66666666-6666-4666-8666-666666666666",
        firstName: "سارا",
        lastName: "احمدی",
      },
      branch: {
        id: "77777777-7777-4777-8777-777777777777",
        name: "مرکزی",
      },
      classroom: {
        id: "88888888-8888-4888-8888-888888888888",
        name: "کلاس ۱",
        capacity: 15,
      },
      sessions: [
        {
          sessionNumber: 1,
          dayOfWeek: "SATURDAY",
          startTime: "09:00",
          endTime: "10:30",
        },
      ],
      warnings: [],
      selectionReasons: [{ code: "MATCHES_TEACHER_QUALIFICATION" as const }],
      isLocked: false,
      isManuallyEdited: true,
      lastEditedAt: timestamp,
      editedFields: ["teacherId"],
      publishedClassId: null,
    },
  ],
  run: {
    id: runId,
    status: "SUCCEEDED",
    termId: "99999999-9999-4999-8999-999999999999",
    branchId: "77777777-7777-4777-8777-777777777777",
    term: {
      id: "99999999-9999-4999-8999-999999999999",
      title: "پاییز ۱۴۰۳",
      startDate: "2026-09-23T00:00:00.000Z",
      endDate: "2026-12-20T00:00:00.000Z",
    },
    branch: {
      id: "77777777-7777-4777-8777-777777777777",
      name: "مرکزی",
    },
  },
  ...overrides,
})

describe("SchedulingPlanDetailsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mockPush.mockReset()
  })

  it("renders breadcrumb and plan details correctly", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
      queryFn: async () => createPlan(planId, 1),
    } as never)

    render(<SchedulingPlanDetailsPage />)

    expect(await screen.findByText("جزئیات برنامه ۱")).toBeInTheDocument()
    expect(screen.getAllByText("پاییز ۱۴۰۳").length).toBeGreaterThan(0)
    expect(screen.getAllByText("مرکزی").length).toBeGreaterThan(0)
    expect(screen.getAllByText("۸۴٪").length).toBeGreaterThan(0)
    expect(screen.getAllByText("کلاس ۱").length).toBeGreaterThan(0)
    expect(screen.queryByText("هشدارهای برنامه")).not.toBeInTheDocument()
  })

  it("selects a draft plan directly from the details page", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
      queryFn: async () => createPlan(planId, 1, { status: "DRAFT" }),
    } as never)
    const select = vi.fn(async () => ({
      planId,
      runId,
      status: "SELECTED" as const,
      selectedAt: timestamp,
    }))
    vi.spyOn(schedulingResource.selectPlan, "toMutation").mockReturnValue({
      mutationFn: select,
    })

    render(<SchedulingPlanDetailsPage />)

    const selectButton = await screen.findByRole("button", {
      name: "انتخاب این برنامه",
    })
    fireEvent.click(selectButton)

    await waitFor(() => expect(select).toHaveBeenCalledTimes(1))
    expect(select).toHaveBeenCalledWith(
      { planId, instituteId },
      expect.any(Object)
    )
  })

  it("renders weekly calendar view without view mode toggle", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
      queryFn: async () =>
        createPlan(planId, 1, {
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
            ],
            assignments: [],
            coversAllUnresolvedClasses: true,
            usesPreferredThreeDayPattern: true,
            hasConsecutiveTimes: true,
          },
        }),
    } as never)

    render(<SchedulingPlanDetailsPage />)

    expect(await screen.findByText("جزئیات برنامه ۱")).toBeInTheDocument()
    expect(screen.getAllByText("کلاس سطح A2").length).toBeGreaterThan(0)
    expect(
      screen.queryByRole("button", { name: "نمای فهرستی" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "نمای تقویمی" })
    ).not.toBeInTheDocument()
  })

  it("displays not-found state when plan cannot be loaded", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
      queryFn: async () => Promise.reject(new Error("Plan not found")),
    } as never)

    render(<SchedulingPlanDetailsPage />)

    expect(
      await screen.findByText("برنامه زمان‌بندی یافت نشد")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "تلاش مجدد" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "بازگشت به زمان‌بندی" })
    ).toBeInTheDocument()
  })

  it("supports supervisor teacher outreach for unassigned classes with staffing fallback options", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
      queryFn: async () =>
        createPlan(planId, 1, {
          proposals: [
            ...createPlan(planId, 1).proposals,
            {
              id: "prop-unassigned-ame",
              instituteId,
              planId,
              courseId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
              teacherId: null,
              teacher: null,
              branchId: "77777777-7777-4777-8777-777777777777",
              classroomId: "88888888-8888-4888-8888-888888888888",
              title: "AME 3-5",
              capacity: 15,
              deliveryMode: "IN_PERSON",
              daysOfWeek: ["SATURDAY", "MONDAY"],
              startTime: "11:00",
              endTime: "12:30",
              course: {
                id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
                title: "AME 3-5",
              },
              branch: {
                id: "77777777-7777-4777-8777-777777777777",
                name: "مرکزی",
              },
              classroom: {
                id: "88888888-8888-4888-8888-888888888888",
                name: "کلاس ۱",
                capacity: 15,
              },
              sessions: [
                {
                  sessionNumber: 1,
                  dayOfWeek: "SATURDAY",
                  startTime: "11:00",
                  endTime: "12:30",
                },
              ],
              warnings: [],
              selectionReasons: [],
              isLocked: false,
              isManuallyEdited: false,
              lastEditedAt: timestamp,
              editedFields: [],
              publishedClassId: null,
            },
          ],
          unresolvedRequirements: [
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
                teacherCalendars: [],
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
          ] as unknown as SchedulingPlanDetailsDto["unresolvedRequirements"],
        }),
    } as never)

    const toggleOutreach = vi.fn(async () =>
      Promise.resolve({
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        status: "CONTACTED" as const,
      })
    )
    vi.spyOn(
      schedulingResource.toggleTeacherOutreach,
      "toMutation"
    ).mockReturnValue({
      mutationFn: toggleOutreach,
    })

    render(<SchedulingPlanDetailsPage />)

    const unassignedCard = await screen.findByTestId(
      "calendar-class-card-prop-unassigned-ame"
    )
    fireEvent.click(unassignedCard)

    const dialog = await screen.findByTestId("staffing-fallback-dialog")
    expect(dialog).toBeInTheDocument()
    expect(
      within(dialog).getByText(/زمان‌های ممکن با برنامه استاد تداخل دارند/)
    ).toBeInTheDocument()
    expect(within(dialog).getAllByText(/دکتر بهنام/)[0]).toBeInTheDocument()
    expect(
      within(dialog).getByText("تحلیل جابه‌جایی استادان:")
    ).toBeInTheDocument()

    const acceptButton = await within(dialog).findByRole("button", {
      name: /استاد پذیرفت/,
    })
    expect(acceptButton).toHaveAttribute("aria-pressed", "false")

    fireEvent.click(acceptButton)

    await waitFor(() => expect(toggleOutreach).toHaveBeenCalledTimes(1))
    expect(toggleOutreach).toHaveBeenCalledWith(
      {
        planId,
        instituteId,
        body: {
          unresolvedRequirementId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          optionKey: "ame-3-5-behnam-sunday-1730",
          teacherId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          deliveryMode: "IN_PERSON",
          daysOfWeek: ["SUNDAY", "TUESDAY", "THURSDAY"],
          startTime: "17:30",
          endTime: "19:00",
          classroomId: "88888888-8888-4888-8888-888888888888",
          availabilityChangeDays: ["SUNDAY", "TUESDAY", "THURSDAY"],
          action: "ACCEPT",
        },
      },
      expect.any(Object)
    )
  })

  it("opens filter dialog and renders teacher combobox in AdminFilterBar", async () => {
    const teacherId = "66666666-6666-4666-8666-666666666666"
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
      queryFn: async () =>
        createPlan(planId, 1, {
          teacherCalendars: [
            {
              teacher: {
                id: teacherId,
                firstName: "سارا",
                lastName: "احمدی",
                avatarUrl: null,
              },
              teachableCourses: [
                {
                  id: "55555555-5555-4555-8555-555555555555",
                  title: "A2",
                },
              ],
              slots: [
                {
                  dayOfWeek: "SATURDAY",
                  startTime: "09:00",
                  endTime: "10:30",
                  status: "FREE",
                  title: null,
                  source: "AVAILABILITY",
                },
              ],
            },
          ],
        }),
    } as never)

    render(<SchedulingPlanDetailsPage />)

    expect(await screen.findByText("جزئیات برنامه ۱")).toBeInTheDocument()

    // Find and click the filter button
    const filterButton = screen.getByRole("button", { name: /فیلتر/ })
    expect(filterButton).toBeInTheDocument()
    fireEvent.click(filterButton)
    // The filter dialog is open, showing teacher filter modal and combobox trigger
    expect(
      (await screen.findAllByText("فیلتر بر اساس استاد")).length
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByRole("combobox", { name: "انتخاب استاد..." })
    ).toBeInTheDocument()
  })
})
