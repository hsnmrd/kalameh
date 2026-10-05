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

  it("renders Step 1 as current step when institute has no operating phases", () => {
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
      screen.getAllByText("۱. فازهای تحصیلی و تقویم سالانه").length
    ).toBeGreaterThan(0)
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
    const step1Link = screen.getAllByRole("link", { name: /تنظیم فازها/i })
    expect(step1Link.length).toBeGreaterThan(0)
    expect(step1Link[0]).toHaveAttribute("href", "/operating-phases")
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
      screen.getAllByText(/تعیین سطح زبان‌آموزان/i).length
    ).toBeGreaterThan(0)
    expect(
      screen.getByText("پیشرفت کلی: ۴۰٪ (۲ از ۵ گام تکمیل شده)")
    ).toBeInTheDocument()
  })

  it("renders smart scheduling 3 sub-phases in Step 4", () => {
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

    expect(screen.getByText("مراحل تقویم آموزشی هوشمند")).toBeInTheDocument()
    expect(
      screen.getByText("محاسبه خودکار تقاضا و نیازهای کلاسی")
    ).toBeInTheDocument()
    expect(
      screen.getByText("تولید هوشمند پیشنهادهای زمان‌بندی")
    ).toBeInTheDocument()
    expect(
      screen.getByText("بررسی، ویرایش و انتخاب برنامه بهینه")
    ).toBeInTheDocument()
  })

  it("indicates all steps completed when classes are published", () => {
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
      screen.getByText(
        "همه مراحل با موفقیت تکمیل شده‌اند و آموزشگاه آماده فعالیت کامل است."
      )
    ).toBeInTheDocument()
  })
})
