import { describe, it, expect, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { StudentClassCard } from "../components/student-class-card"
import { StudentLevelHeader } from "../components/student-level-header"
import type { ClassDto } from "@workspace/types"

describe("Student Classes Components", () => {
  const mockClass: ClassDto = {
    id: "class-1",
    instituteId: "inst-1",
    termId: "term-1",
    courseId: "course-1",
    title: "Top Notch 1A - گروه صبح",
    capacity: 15,
    fee: 1500000,
    teacherName: "استاد رضایی",
    schedule: "روزهای زوج ۱۶:۰۰ تا ۱۷:۳۰",
    enrolledCount: 10,
    term: { id: "term-1", title: "پاییز ۱۴۰۵", isActive: true },
    course: { id: "course-1", title: "Top Notch 1A", baseFee: 1500000 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  describe("StudentLevelHeader", () => {
    it("should display allowed level title", () => {
      render(<StudentLevelHeader allowedCourseTitle="Top Notch 1A" />)
      expect(screen.getByText(/Top Notch 1A/i)).toBeInTheDocument()
    })

    it("should display default entry level text when no level assigned", () => {
      render(<StudentLevelHeader allowedCourseTitle={undefined} />)
      expect(screen.getByText(/سطح پایه/i)).toBeInTheDocument()
    })

    it("should display description when defaultOpen is true", () => {
      render(
        <StudentLevelHeader allowedCourseTitle="Top Notch 1A" defaultOpen />
      )
      expect(
        screen.getByText(/فقط کلاس‌های متناسب با این سطح/i)
      ).toBeInTheDocument()
    })
  })

  describe("StudentClassCard", () => {
    it("should render class card information, schedule, and enroll button", () => {
      render(<StudentClassCard cls={mockClass} onEnroll={vi.fn()} />)

      expect(screen.getByText("Top Notch 1A - گروه صبح")).toBeInTheDocument()
      expect(screen.getByText(/استاد رضایی/i)).toBeInTheDocument()
      expect(screen.getByText(/روزهای زوج ۱۶:۰۰ تا ۱۷:۳۰/i)).toBeInTheDocument()
      expect(screen.getByText("10 / 15")).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /ثبت‌نام|enroll/i })
      ).toBeInTheDocument()
    })

    it("should show waitlist button when class is full", () => {
      const fullClass = { ...mockClass, enrolledCount: 15, capacity: 15 }
      const onWaitlist = vi.fn()
      render(
        <StudentClassCard
          cls={fullClass}
          onEnroll={vi.fn()}
          onWaitlist={onWaitlist}
        />
      )

      const waitlistBtn = screen.getByRole("button", {
        name: /لیست انتظار|waitlist/i,
      })
      expect(waitlistBtn).toBeInTheDocument()
      expect(waitlistBtn).not.toBeDisabled()
    })

    it("should show enrolled status button when student is already enrolled", () => {
      const enrolledClass = {
        ...mockClass,
        studentEnrollmentStatus: "ENROLLED" as const,
      }
      render(<StudentClassCard cls={enrolledClass} />)

      expect(
        screen.getByRole("button", { name: /ثبت‌نام قطعی|enrolled/i })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: /انتخاب و ثبت‌نام در کلاس/i })
      ).not.toBeInTheDocument()
    })

    it("should show pending approval status button when student submitted receipt", () => {
      const pendingApprovalClass = {
        ...mockClass,
        studentEnrollmentStatus: "PENDING_APPROVAL" as const,
      }
      render(<StudentClassCard cls={pendingApprovalClass} />)

      expect(
        screen.getByRole("button", {
          name: /در انتظار تأیید|pending approval/i,
        })
      ).toBeInTheDocument()
    })

    it("should show complete payment button when student has active reservation", () => {
      const pendingPaymentClass = {
        ...mockClass,
        studentEnrollmentStatus: "PENDING_PAYMENT" as const,
      }
      render(<StudentClassCard cls={pendingPaymentClass} />)

      expect(
        screen.getByRole("button", { name: /تکمیل پرداخت|complete payment/i })
      ).toBeInTheDocument()
    })

    it("should show waitlisted button when student is on waitlist", () => {
      const waitlistedClass = {
        ...mockClass,
        studentEnrollmentStatus: "WAITLISTED" as const,
      }
      render(<StudentClassCard cls={waitlistedClass} />)

      expect(
        screen.getByRole("button", { name: /لیست انتظار|waitlisted/i })
      ).toBeInTheDocument()
    })
  })
})
