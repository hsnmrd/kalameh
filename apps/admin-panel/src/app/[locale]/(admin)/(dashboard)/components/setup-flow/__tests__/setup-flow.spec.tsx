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
    expect(
      screen.getByText("۱. فازهای تحصیلی و تقویم سالانه")
    ).toBeInTheDocument()
    expect(
      screen.getByText("۲. ساخت هوشمند ترم‌ها (صفحه ترم‌ها)")
    ).toBeInTheDocument()
    expect(
      screen.getByText("۳. ارزیابی زبان‌آموزان و تعیین سطح")
    ).toBeInTheDocument()
    expect(
      screen.getByText("۴. تقویم آموزشی هوشمند (صفحه کلاس‌ها)")
    ).toBeInTheDocument()
    expect(
      screen.getByText("۵. انتشار کلاس‌ها و ثبت‌نام زبان‌آموزان")
    ).toBeInTheDocument()

    // Step 1 action button should point to /operating-phases
    const step1Link = screen.getByRole("link", { name: /تنظیم فازها/i })
    expect(step1Link).toHaveAttribute("href", "/operating-phases")
    expect(screen.getByText("گام فعلی شما")).toBeInTheDocument()
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

    expect(
      screen.getByRole("link", { name: /تعیین سطح زبان‌آموزان/i })
    ).toBeInTheDocument()
    expect(
      screen.getByText("پیشرفت کلی: ۴۰٪ (۲ از ۵ گام تکمیل شده)")
    ).toBeInTheDocument()
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

    // Completed steps (Step 1 and 2) show simple "مشاهده" and "تکمیل شده"
    const completedBadges = screen.getAllByText("تکمیل شده")
    expect(completedBadges.length).toBe(2)

    // The long description of completed step 1 should NOT be shown in the compact card
    expect(
      screen.queryByText(
        "تعریف شیفت‌های آموزشی، زمان‌بندی روزانه و تعطیلات سالانه آموزشگاه"
      )
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

    expect(
      screen.getByText("پیشرفت کلی: ۱۰۰٪ (۵ از ۵ گام تکمیل شده)")
    ).toBeInTheDocument()
    const allCompletedBadges = screen.getAllByText("تکمیل شده")
    expect(allCompletedBadges.length).toBe(5)
  })
})
