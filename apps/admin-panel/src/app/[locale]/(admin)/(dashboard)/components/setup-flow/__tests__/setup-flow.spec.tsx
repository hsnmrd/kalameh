import * as React from "react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "../../../../../../../test/test-utils"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SetupFlow } from "../index"
import {
  operatingPhasesResource,
  termsResource,
  studentsResource,
  schedulingResource,
  classesResource,
} from "@/lib/api"
import { useOperatingPhasesReviewStore } from "@/lib/stores"

vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  useIsRtl: () => true,
}))

describe("SetupFlow Component", () => {
  let queryClient: QueryClient
  const mockInstituteId = "inst-test-123"

  beforeEach(() => {
    useOperatingPhasesReviewStore.setState({ reviewedInstituteIds: {} })
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  it("renders Step 1 as prominent current step when institute has no operating phases", () => {
    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      []
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      []
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )

    render(
      <QueryClientProvider client={queryClient}>
        <SetupFlow instituteId={mockInstituteId} classesCount={0} />
      </QueryClientProvider>
    )

    expect(
      screen.getByText("مسیر راه‌اندازی و چرخه آموزشی آموزشگاه")
    ).toBeInTheDocument()
    expect(screen.getByText("۱. تقویم و شیفت‌های آموزشی")).toBeInTheDocument()
    expect(screen.getByText("۲. ساخت ترم‌های آموزشی")).toBeInTheDocument()
    expect(screen.getByText("۳. تعیین سطح زبان‌آموزان")).toBeInTheDocument()
    expect(
      screen.getByText("۴. برنامه‌ریزی هوشمند کلاس‌ها")
    ).toBeInTheDocument()
    expect(screen.getByText("۵. انتشار کلاس‌ها و ثبت‌نام")).toBeInTheDocument()

    // Step 1 action button should point to /operating-phases
    const step1Link = screen.getByRole("link", { name: /تنظیم فازها/i })
    expect(step1Link).toHaveAttribute("href", "/operating-phases")
    expect(screen.getByText("گام فعلی")).toBeInTheDocument()
    // Exactly one current step badge exists
    expect(screen.getAllByText("گام فعلی").length).toBe(1)
  })

  it("shows Step 3 as current when phases and terms exist", () => {
    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ id: "p-1", title: "فاز پاییز" }]
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "t-1", title: "ترم اول" }]
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      []
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )

    render(
      <QueryClientProvider client={queryClient}>
        <SetupFlow instituteId={mockInstituteId} classesCount={0} />
      </QueryClientProvider>
    )

    expect(screen.getByRole("link", { name: /تعیین سطح/i })).toBeInTheDocument()
    expect(screen.queryByText(/پیشرفت کلی/i)).not.toBeInTheDocument()
    // Exactly ONE step is current
    expect(screen.getAllByText("گام فعلی").length).toBe(1)
  })

  it("shows strictly ONE current step when later steps have data (prevents multiple current steps)", () => {
    // Step 1 done
    useOperatingPhasesReviewStore.getState().markAsReviewed(mockInstituteId)
    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ id: "p-1", title: "فاز پاییز" }]
    )
    // Step 2 NOT done
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    // Step 3 HAS data (e.g. students exist)
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "s-1", firstName: "Ali" }]
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      []
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )

    render(
      <QueryClientProvider client={queryClient}>
        <SetupFlow instituteId={mockInstituteId} classesCount={0} />
      </QueryClientProvider>
    )

    // Step 2 must be the ONLY current step
    const currentBadges = screen.getAllByText("گام فعلی")
    expect(currentBadges.length).toBe(1)

    // Step 2 action button is present
    expect(
      screen.getByRole("link", { name: /ساخت ترم‌ها/i })
    ).toBeInTheDocument()
    // Step 4 is NOT current
    expect(
      screen.queryByRole("link", { name: /برنامه‌ریزی هوشمند/i })
    ).not.toBeInTheDocument()
  })

  it("reduces data and detail on completed tasks to prevent getting attention", () => {
    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ id: "p-1" }]
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "t-1" }]
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      []
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )

    render(
      <QueryClientProvider client={queryClient}>
        <SetupFlow instituteId={mockInstituteId} classesCount={0} />
      </QueryClientProvider>
    )

    // Completed steps (Step 1 and 2) show simple "مشاهده" and omit "تکمیل شد" badge
    const viewButtons = screen.getAllByRole("link", { name: /مشاهده/i })
    expect(viewButtons.length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText("تکمیل شد")).not.toBeInTheDocument()

    // The description of completed step 1 should NOT be shown in the compact card
    expect(
      screen.queryByText("تنظیم شیفت‌ها و تقویم سالانه آموزشگاه")
    ).not.toBeInTheDocument()
  })

  it("indicates all steps completed with 100% progress when classes are published", () => {
    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ id: "p-1" }]
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "t-1" }]
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "s-1" }]
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [
        {
          id: "t-1",
          schedulingStatus: "PUBLISHED",
          requirementsCount: 5,
          latestRun: { id: "r-1" },
        },
      ]
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      [{ id: "c-1" }]
    )

    render(
      <QueryClientProvider client={queryClient}>
        <SetupFlow instituteId={mockInstituteId} classesCount={5} />
      </QueryClientProvider>
    )

    expect(screen.queryByText(/پیشرفت کلی/i)).not.toBeInTheDocument()
    const allViewButtons = screen.getAllByRole("link", { name: /مشاهده/i })
    expect(allViewButtons.length).toBe(5)
    expect(screen.queryByText("تکمیل شد")).not.toBeInTheDocument()
    // No step is current when all are completed
    expect(screen.queryByText("گام فعلی")).not.toBeInTheDocument()
  })

  it("renders checklist rows with desktop half width, active card, and completed line-through", () => {
    // Step 1 done, Step 2 current, Step 3 pending
    useOperatingPhasesReviewStore.getState().markAsReviewed(mockInstituteId)
    queryClient.setQueryData(
      operatingPhasesResource.list.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      [{ id: "p-1" }]
    )
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      studentsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      schedulingResource.terms.toQuery({ instituteId: mockInstituteId })
        .queryKey,
      []
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SetupFlow instituteId={mockInstituteId} classesCount={0} />
      </QueryClientProvider>
    )

    // 1. Container restricts width on desktop (lg:w-1/2)
    const rootElement = container.firstElementChild as HTMLElement
    expect(rootElement.className).toContain("lg:w-1/2")

    // 2. Active step has prominent card style and "گام فعلی" badge
    const currentBadge = screen.getByText("گام فعلی")
    const activeRow = currentBadge.closest("a") as HTMLElement
    expect(activeRow).toBeInTheDocument()
    expect(activeRow.className).toContain("bg-card")
    expect(activeRow.className).toContain("border-primary/50")

    // 3. Completed step (Step 1) has blue-tinted row and line-through text
    const completedText = screen.getByText("۱. تقویم و شیفت‌های آموزشی")
    expect(completedText.className).toContain("line-through")
    const completedRow = completedText.closest("a") as HTMLElement
    expect(completedRow.className).toContain("bg-primary/10")

    // 4. Pending step (Step 3) has muted row styling
    const pendingText = screen.getByText("۳. تعیین سطح زبان‌آموزان")
    expect(pendingText.className).not.toContain("line-through")
    const pendingRow = pendingText.closest("div.rounded-2xl") as HTMLElement
    expect(pendingRow.className).toContain("bg-muted/30")

    // 5. All 5 steps are rendered together in the list
    expect(screen.getByText("۱. تقویم و شیفت‌های آموزشی")).toBeInTheDocument()
    expect(screen.getByText("۲. ساخت ترم‌های آموزشی")).toBeInTheDocument()
    expect(screen.getByText("۳. تعیین سطح زبان‌آموزان")).toBeInTheDocument()
    expect(
      screen.getByText("۴. برنامه‌ریزی هوشمند کلاس‌ها")
    ).toBeInTheDocument()
    expect(screen.getByText("۵. انتشار کلاس‌ها و ثبت‌نام")).toBeInTheDocument()
  })
})
