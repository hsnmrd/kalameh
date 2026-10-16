import { describe, it, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { StudentProfileModal } from "../components/student-profile-modal"
import { ResetPasswordModal } from "../components/reset-password-modal"
import { CreateStudentModal } from "../components/create-student-modal"
import { EditStudentModal } from "../components/edit-student-modal"
import { AddStudentNoteModal } from "../components/add-student-note-modal"
import { studentsResource } from "@/lib/api"
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
    currentAllowedCourseId: "11111111-1111-4111-8111-111111111111",
    currentAllowedCourse: {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Starter 101",
      baseFee: 500000,
    },
    branchId: "22222222-2222-4222-8222-222222222222",
    branch: {
      id: "22222222-2222-4222-8222-222222222222",
      name: "شعبه مرکزی",
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
      expect(screen.getByText("شعبه مرکزی")).toBeInTheDocument()
    })

    it("should render student notes history and note author", () => {
      const studentWithNotes: StudentDto = {
        ...mockStudent,
        studentProfile: {
          ...mockStudent.studentProfile,
          notes: [
            {
              id: "note-1",
              studentProfileId: "profile-1",
              createdByUserId: "user-1",
              content: "Student needs extra tutoring in listening",
              createdBy: {
                id: "user-1",
                firstName: "Mohammad",
                lastName: "Ahmadi",
              },
              createdAt: "2024-02-01T10:00:00.000Z",
              updatedAt: "2024-02-01T10:00:00.000Z",
            },
          ],
        },
      }

      render(
        <StudentProfileModal
          student={studentWithNotes}
          open={true}
          onClose={vi.fn()}
        />
      )

      expect(
        screen.getByText("Student needs extra tutoring in listening")
      ).toBeInTheDocument()
      expect(screen.getByText(/Mohammad Ahmadi/)).toBeInTheDocument()
    })

    it("should render action buttons in footer and invoke callbacks", () => {
      const handleClose = vi.fn()
      const handleEdit = vi.fn()
      const handleAddNote = vi.fn()
      const handleResetPassword = vi.fn()

      render(
        <StudentProfileModal
          student={mockStudent}
          open={true}
          onClose={handleClose}
          onEdit={handleEdit}
          onAddNote={handleAddNote}
          onResetPassword={handleResetPassword}
        />
      )

      const moreBtn = screen.getByRole("button", {
        name: /مشاهده پرونده|View Profile/i,
      })
      fireEvent.click(moreBtn)

      const addNoteItem = screen.getByText(/ثبت یادداشت|Add Note/i)
      const resetPwdItem = screen.getByText(/بازنشانی رمز عبور|Reset Password/i)
      const editItem = screen.getByText(/ویرایش مشخصات|Edit/i)

      expect(addNoteItem).toBeInTheDocument()
      expect(resetPwdItem).toBeInTheDocument()
      expect(editItem).toBeInTheDocument()

      fireEvent.click(addNoteItem)
      expect(handleClose).toHaveBeenCalled()
      expect(handleAddNote).toHaveBeenCalledWith(mockStudent)
    })

    it("should render backdrop and drawer overlay on mobile", () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(
        <StudentProfileModal
          student={mockStudent}
          open={true}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      )

      const moreBtn = screen.getByRole("button", {
        name: /مشاهده پرونده|View Profile/i,
      })
      fireEvent.click(moreBtn)

      // Drawer overlay should be mounted and have blur & dimming backdrop
      const overlay = document.querySelector('[data-slot="drawer-overlay"]')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass("backdrop-blur-xs", "bg-black/40")

      // Drawer content should be rendered
      expect(screen.getByText(/ویرایش مشخصات|Edit/i)).toBeInTheDocument()
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
      expect(
        screen.getByRole("button", {
          name: /ثبت|Submit/i,
        })
      ).toBeInTheDocument()
    })
  })

  describe("AddStudentNoteModal", () => {
    it("should render note dialog with student name and textarea", () => {
      render(
        <AddStudentNoteModal
          student={mockStudent}
          open={true}
          onClose={vi.fn()}
        />
      )

      expect(
        screen.getByRole("heading", {
          name: /ثبت یادداشت جدید در پرونده|Add Student Note/i,
        })
      ).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText(
          /متن یادداشت پرونده را وارد کنید\.\.\.|Enter note content\.\.\./i
        )
      ).toBeInTheDocument()
    })

    it("should format course short title in student card badge", () => {
      const studentWithLongCourse: StudentDto = {
        ...mockStudent,
        currentAllowedCourse: {
          id: "course-2",
          title: "American English File 3 - 5",
          baseFee: 500000,
        },
      }

      render(
        <AddStudentNoteModal
          student={studentWithLongCourse}
          open={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText("AEF 3-5")).toBeInTheDocument()
    })
  })

  describe("EditStudentModal", () => {
    it("should render edit dialog with existing student data and avatar preview", () => {
      const studentWithAvatar: StudentDto = {
        ...mockStudent,
        avatarUrl: "/uploads/avatars/test-student.jpg",
      }

      render(
        <EditStudentModal
          student={studentWithAvatar}
          open={true}
          onClose={vi.fn()}
        />
      )

      expect(
        screen.getByRole("heading", {
          name: /ویرایش اطلاعات فراگیر|Edit Student/i,
        })
      ).toBeInTheDocument()

      const img = screen.getByAltText(/test-student\.jpg|Attachment preview/i)
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute(
        "src",
        expect.stringContaining("test-student.jpg")
      )
    })

    it("should close without calling mutation if no fields are changed", async () => {
      const mockMutate = vi.fn()
      vi.spyOn(studentsResource.update, "toMutation").mockReturnValue({
        mutationFn: mockMutate,
      } as never)

      const handleClose = vi.fn()
      render(
        <EditStudentModal
          student={mockStudent}
          open={true}
          onClose={handleClose}
        />
      )

      const submitBtn = screen.getByRole("button", {
        name: /ثبت|ذخیره|submit/i,
      })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(mockMutate).not.toHaveBeenCalled()
        expect(handleClose).toHaveBeenCalled()
      })
    })

    it("should only send changed fields and omit avatar/avatarUrl if unchanged", async () => {
      const mockMutate = vi.fn()
      vi.spyOn(studentsResource.update, "toMutation").mockReturnValue({
        mutationFn: mockMutate,
      } as never)

      const studentWithAvatar: StudentDto = {
        ...mockStudent,
        avatarUrl: "/uploads/avatars/test-student.jpg",
      }

      render(
        <EditStudentModal
          student={studentWithAvatar}
          open={true}
          onClose={vi.fn()}
        />
      )

      const firstNameInput = document.querySelector(
        'input[name="firstName"]'
      ) as HTMLInputElement
      fireEvent.change(firstNameInput, { target: { value: "Reza" } })

      const submitBtn = screen.getByRole("button", {
        name: /ثبت|ذخیره|submit/i,
      })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "student-1",
            body: { firstName: "Reza" },
          }),
          expect.anything()
        )
      })
    })

    it("should send avatarUrl: null when photo is removed", async () => {
      const mockMutate = vi.fn()
      vi.spyOn(studentsResource.update, "toMutation").mockReturnValue({
        mutationFn: mockMutate,
      } as never)

      const studentWithAvatar: StudentDto = {
        ...mockStudent,
        avatarUrl: "/uploads/avatars/test-student.jpg",
      }

      render(
        <EditStudentModal
          student={studentWithAvatar}
          open={true}
          onClose={vi.fn()}
        />
      )

      const removeBtn = screen.getByRole("button", {
        name: /حذف تصویر|Remove photo/i,
      })
      fireEvent.click(removeBtn)

      const submitBtn = screen.getByRole("button", {
        name: /ثبت|ذخیره|submit/i,
      })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "student-1",
            body: { avatarUrl: null },
          }),
          expect.anything()
        )
      })
    })
  })
})
