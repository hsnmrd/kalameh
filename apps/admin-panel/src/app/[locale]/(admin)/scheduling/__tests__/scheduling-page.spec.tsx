import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../../../../test/test-utils"
import { INSTITUTE_NAV_ITEMS } from "@/data"
import commonMessagesEn from "@/messages/en/common.json"
import schedulingMessagesEn from "@/messages/en/scheduling.json"
import * as hooks from "@/lib/hooks"
import * as stores from "@/lib/stores"
import { schedulingResource } from "@/lib/api"
import {
  APP_MODULES,
  ROLES,
  type SchedulingTermSummaryDto,
} from "@workspace/types"
import SchedulingPage from "../page"

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
  usePathname: () => "/scheduling",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
  usePathname: () => "/scheduling",
  Link: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe("Unified scheduling workspace", () => {
  afterEach(() => vi.restoreAllMocks())

  it("exposes scheduling in institute navigation", () => {
    expect(INSTITUTE_NAV_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "scheduling",
          href: "/scheduling",
        }),
      ])
    )
  })

  it("renders empty state without search or tabs when no terms exist in Persian", () => {
    render(<SchedulingPage />)

    expect(screen.getByText("ترمی یافت نشد")).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText("جست‌وجوی دوره...")
    ).not.toBeInTheDocument()
    expect(screen.queryByText("تقاضا و نیازهای کلاسی")).not.toBeInTheDocument()
  })

  it("renders empty state without search or tabs when no terms exist in English", () => {
    render(<SchedulingPage />, {
      locale: "en",
      messages: {
        common: commonMessagesEn,
        scheduling: schedulingMessagesEn,
      },
    })

    expect(screen.getByText("No terms found")).toBeInTheDocument()
    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument()
    expect(screen.queryByText("Demand & Requirements")).not.toBeInTheDocument()
  })

  it("auto-selects upcoming term starting within 10 days and renders tab-less demand overview", async () => {
    const mockTerms: SchedulingTermSummaryDto[] = [
      {
        id: "term-summer",
        title: "تابستان ۱۴۰۵",
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        classesCount: 5,
        requirementsCount: 2,
        totalRequiredClasses: 4,
        schedulingStatus: "PUBLISHED",
      },
      {
        id: "term-fall",
        title: "پاییز ۱۴۰۵",
        startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // starts in 4 days
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        classesCount: 0,
        requirementsCount: 3,
        totalRequiredClasses: 6,
        schedulingStatus: "READY_TO_SCHEDULE",
      },
    ]

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: "inst-1",
      activeInstitute: {
        id: "inst-1",
        name: "Test Institute",
        enabledModules: [APP_MODULES.CLASSES_COURSES],
      },
    } as ReturnType<typeof stores.useActiveInstitute>)

    vi.spyOn(schedulingResource.terms, "toQuery").mockReturnValue({
      queryKey: ["scheduling", "terms", "inst-1"],
      queryFn: async () => mockTerms,
    } as never)

    render(<SchedulingPage />)

    expect(
      (await screen.findAllByText("پاییز ۱۴۰۵")).length
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("آماده تولید برنامه")).toBeInTheDocument()
    // Verify no search input exists
    expect(
      screen.queryByPlaceholderText("جست‌وجوی دوره...")
    ).not.toBeInTheDocument()
    // Verify no tabs exist
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
    // Verify header generate button is present (both desktop filter action and mobile FAB)
    const generateButtons = screen.getAllByRole("button", {
      name: "ثبت و ادامه",
    })
    expect(generateButtons.length).toBeGreaterThanOrEqual(1)
  })

  it("saves demand adjustments and navigates to /scheduling/generate on clicking apply button", async () => {
    const mockTerms: SchedulingTermSummaryDto[] = [
      {
        id: "term-fall",
        title: "پاییز ۱۴۰۵",
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        classesCount: 0,
        requirementsCount: 0,
        totalRequiredClasses: 0,
        schedulingStatus: "READY_TO_SCHEDULE",
      },
    ]

    const mockDemandReport = {
      termId: "term-fall",
      termTitle: "پاییز ۱۴۰۵",
      maxStudentsPerClass: 14,
      maxAvailableRoomCapacity: 20,
      effectiveCapacityLimit: 14,
      warnings: [],
      totalEligibleStudents: 25,
      totalContinuingStudents: 20,
      totalNewPlacements: 5,
      totalSuggestedClasses: 2,
      totalPlannedCapacity: 25,
      totalUncoveredStudents: 0,
      courses: [
        {
          courseId: "11111111-1111-1111-1111-111111111111",
          courseTitle: "انگلیسی کودکان ۱",
          baseFee: 1500000,
          eligibleStudentsCount: 25,
          passedPrerequisiteCount: 20,
          continuingStudentsCount: 20,
          newPlacementCount: 5,
          morningShiftCount: 5,
          afternoonShiftCount: 15,
          flexibleShiftCount: 5,
          evenDaysPreferenceCount: 18,
          oddDaysPreferenceCount: 7,
          anyDayPreferenceCount: 0,
          suggestedClassCount: 2,
          suggestedClasses: [
            { key: "class-1", capacity: 13 },
            { key: "class-2", capacity: 12 },
          ],
          plannedCapacity: 25,
          uncoveredStudentCount: 0,
          sessionsPerWeek: 2,
        },
      ],
    }

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: "inst-1",
      activeInstitute: {
        id: "inst-1",
        name: "Test Institute",
        enabledModules: [APP_MODULES.CLASSES_COURSES],
      },
    } as ReturnType<typeof stores.useActiveInstitute>)

    vi.spyOn(schedulingResource.terms, "toQuery").mockReturnValue({
      queryKey: ["scheduling", "terms", "inst-1"],
      queryFn: async () => mockTerms,
    } as never)

    const calculateDemandSpy = vi.fn().mockResolvedValue(mockDemandReport)
    vi.spyOn(schedulingResource.calculateDemand, "toMutation").mockReturnValue({
      mutationFn: calculateDemandSpy,
    } as never)

    const applyMutationSpy = vi.fn().mockResolvedValue({
      createdCount: 1,
      deactivatedCount: 0,
      totalRequirements: 1,
      requirementIds: ["requirement-1"],
    })
    vi.spyOn(schedulingResource.applyDemand, "toMutation").mockReturnValue({
      mutationFn: applyMutationSpy,
    } as never)

    render(<SchedulingPage />)

    expect(
      (await screen.findAllByText("انگلیسی کودکان ۱")).length
    ).toBeGreaterThanOrEqual(1)

    const applyButton = screen.getAllByRole("button", {
      name: "ثبت و ادامه",
    })[0]!
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(applyMutationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          termId: "term-fall",
          items: expect.arrayContaining([
            expect.objectContaining({
              courseId: "11111111-1111-1111-1111-111111111111",
              classes: [{ capacity: 13 }, { capacity: 12 }],
            }),
          ]),
          acknowledgeShortfall: false,
        }),
        expect.anything()
      )
    })
    expect(mockPush).toHaveBeenCalledWith(
      "/scheduling/generate?termId=term-fall"
    )
  })

  it("requires explicit acknowledgement before applying a reviewed shortfall", async () => {
    const mockTerms: SchedulingTermSummaryDto[] = [
      {
        id: "term-fall",
        title: "پاییز ۱۴۰۵",
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        classesCount: 0,
        requirementsCount: 0,
        totalRequiredClasses: 0,
        schedulingStatus: "READY_TO_SCHEDULE",
      },
    ]
    const mockDemandReport = {
      termId: "term-fall",
      termTitle: "پاییز ۱۴۰۵",
      maxStudentsPerClass: 14,
      maxAvailableRoomCapacity: 20,
      effectiveCapacityLimit: 14,
      warnings: [],
      totalEligibleStudents: 20,
      totalContinuingStudents: 20,
      totalNewPlacements: 0,
      totalSuggestedClasses: 1,
      totalPlannedCapacity: 14,
      totalUncoveredStudents: 6,
      courses: [
        {
          courseId: "11111111-1111-1111-1111-111111111111",
          courseTitle: "انگلیسی کودکان ۱",
          baseFee: 1_500_000,
          eligibleStudentsCount: 20,
          passedPrerequisiteCount: 20,
          continuingStudentsCount: 20,
          newPlacementCount: 0,
          morningShiftCount: 10,
          afternoonShiftCount: 10,
          flexibleShiftCount: 0,
          evenDaysPreferenceCount: 10,
          oddDaysPreferenceCount: 10,
          anyDayPreferenceCount: 0,
          suggestedClassCount: 1,
          suggestedClasses: [{ key: "class-1", capacity: 14 }],
          plannedCapacity: 14,
          uncoveredStudentCount: 6,
          sessionsPerWeek: 2,
        },
      ],
    }

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: "inst-1",
      activeInstitute: {
        id: "inst-1",
        name: "Test Institute",
        enabledModules: [APP_MODULES.CLASSES_COURSES],
      },
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.terms, "toQuery").mockReturnValue({
      queryKey: ["scheduling", "terms", "inst-1"],
      queryFn: async () => mockTerms,
    } as never)
    vi.spyOn(schedulingResource.calculateDemand, "toMutation").mockReturnValue({
      mutationFn: vi.fn().mockResolvedValue(mockDemandReport),
    } as never)
    const applyMutationSpy = vi.fn().mockResolvedValue({
      createdCount: 1,
      deactivatedCount: 0,
      totalRequirements: 1,
      requirementIds: ["requirement-1"],
    })
    vi.spyOn(schedulingResource.applyDemand, "toMutation").mockReturnValue({
      mutationFn: applyMutationSpy,
    } as never)

    render(<SchedulingPage />)
    expect(
      (await screen.findAllByText("انگلیسی کودکان ۱")).length
    ).toBeGreaterThanOrEqual(1)

    fireEvent.click(screen.getAllByRole("button", { name: "ثبت و ادامه" })[0]!)
    expect(
      await screen.findByText("با وجود زبان‌آموز بدون ظرفیت ادامه می‌دهید؟")
    ).toBeInTheDocument()
    expect(applyMutationSpy).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "ادامه" }))
    await waitFor(() =>
      expect(applyMutationSpy).toHaveBeenCalledWith(
        expect.objectContaining({ acknowledgeShortfall: true }),
        expect.anything()
      )
    )
  })

  it("renders notEligible empty state when terms exist but none start within 10 days", async () => {
    const distantTerms: SchedulingTermSummaryDto[] = [
      {
        id: "term-distant",
        title: "زمستان ۱۴۰۵",
        startDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000 // starts in 30 days
        ).toISOString(),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        classesCount: 0,
        requirementsCount: 0,
        totalRequiredClasses: 0,
        schedulingStatus: "READY_TO_SCHEDULE",
      },
    ]

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: "inst-1",
      activeInstitute: {
        id: "inst-1",
        name: "Test Institute",
        enabledModules: [APP_MODULES.CLASSES_COURSES],
      },
    } as ReturnType<typeof stores.useActiveInstitute>)

    vi.spyOn(schedulingResource.terms, "toQuery").mockReturnValue({
      queryKey: ["scheduling", "terms", "inst-1"],
      queryFn: async () => distantTerms,
    } as never)

    render(<SchedulingPage />)

    expect(
      await screen.findByRole("heading", {
        name: "ترم فعالی برای زمان‌بندی وجود ندارد",
      })
    ).toBeInTheDocument()
  })

  it("shows the forbidden state without VIEW_CLASSES", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: { role: ROLES.INSTITUTE_ADMIN },
      hasPermission: () => false,
      isLoading: false,
    } as ReturnType<typeof hooks.usePermissions>)
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstitute: { enabledModules: [APP_MODULES.CLASSES_COURSES] },
    } as ReturnType<typeof stores.useActiveInstitute>)

    render(<SchedulingPage />)

    expect(screen.getByText("دسترسی غیرمجاز")).toBeInTheDocument()
    expect(screen.queryByText("تقاضای دوره‌ها")).not.toBeInTheDocument()
  })

  it("shows the module upgrade state when classes and courses are disabled", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: { role: ROLES.INSTITUTE_ADMIN },
      hasPermission: () => true,
      isLoading: false,
    } as ReturnType<typeof hooks.usePermissions>)
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstitute: { enabledModules: [] },
    } as ReturnType<typeof stores.useActiveInstitute>)

    render(<SchedulingPage />)

    expect(screen.getByText("دوره‌ها و کلاس‌ها")).toBeInTheDocument()
    expect(screen.queryByText("تقاضای دوره‌ها")).not.toBeInTheDocument()
  })
})
