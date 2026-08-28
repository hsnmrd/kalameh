import { describe, it, expect, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { StudentProfileModal } from "../components/student-profile-modal"
import { ResetPasswordModal } from "../components/reset-password-modal"
import { CreateStudentModal } from "../components/create-student-modal"
import type { StudentDto } from "@workspace/types"

describe("Student Modals", () => {
  const mockStudent: StudentDto = {
    id: "student-1",
    instituteId: "inst-1",
    firstName: "Ali",
    lastName: "Rezaei",
    phone: "09121111111",
    nationalCode: "0012345678",
    role: "STUDENT",
    isActive: true,
    currentAllowedCourseId: "course-1",
    currentAllowedCourse: {
      id: "course-1",
      title: "Starter 101",
      baseFee: 500000,
    },
    studentProfile: {
      fatherName: "Reza",
      gender: "MALE",
      emergencyPhone: "09129998877",
      address: "Tehran, Valiasr St.",
    },
    enrollmentsCount: 1,
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
  }

  describe("StudentProfileModal", () => {
    it("should render student dossier with personal and guardian details", () => {
      render(
        <StudentProfileModal
          student={mockStudent}
          open={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText("Ali Rezaei")).toBeInTheDocument()
      expect(screen.getByText("09121111111")).toBeInTheDocument()
      expect(screen.getByText("0012345678")).toBeInTheDocument()
      expect(screen.getByText("Reza")).toBeInTheDocument()
      expect(screen.getByText("09129998877")).toBeInTheDocument()
      expect(screen.getByText("Tehran, Valiasr St.")).toBeInTheDocument()
      expect(screen.getByText("Starter 101")).toBeInTheDocument()
    })
  })

  describe("ResetPasswordModal", () => {
    it("should render reset password dialog with student name", () => {
      render(
        <ResetPasswordModal
          student={mockStudent}
          open={true}
          onClose={vi.fn()}
        />
      )

      expect(
        screen.getByText(/بازنشانی رمز عبور فراگیر|Reset Student Password/i)
      ).toBeInTheDocument()
    })
  })

  describe("CreateStudentModal", () => {
    it("should render registration fields with national code, phone and identity inputs", () => {
      render(
        <CreateStudentModal
          open={true}
          onClose={vi.fn()}
          instituteId="inst-1"
        />
      )

      expect(
        screen.getByRole("heading", {
          name: /ثبت فراگیر جدید|Register New Student/i,
        })
      ).toBeInTheDocument()
      expect(screen.getAllByText(/کد ملی|National ID/i).length).toBeGreaterThan(
        0
      )
      expect(screen.getAllByText(/شماره تماس|Phone/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/اطلاعات هویتی|Identity/i)).toBeInTheDocument()
    })
  })
})
