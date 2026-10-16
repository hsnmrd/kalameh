import { describe, it, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { EditTeacherModal } from "../components/edit-teacher-modal"
import { teachersResource } from "@/lib/api"
import type { TeacherDto } from "@workspace/types"

describe("EditTeacherModal Component", () => {
  const mockTeacher: TeacherDto = {
    id: "teacher-1",
    instituteId: "inst-1",
    firstName: "Hassan",
    lastName: "Ghasemi",
    phone: "09123334455",
    nationalCode: "0019998877",
    role: "TEACHER",
    isActive: true,
    avatarUrl: "/uploads/avatars/test-teacher.jpg",
    teacherProfile: {
      id: "profile-1",
      bio: "English literature specialist",
      degree: "Master",
      teachableCourses: [
        {
          id: "qual-1",
          courseId: "11111111-1111-4111-8111-111111111111",
          course: {
            id: "11111111-1111-4111-8111-111111111111",
            title: "AEF 1",
          },
        },
      ],
      availabilities: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it("should render edit dialog with teacher data", () => {
    render(
      <EditTeacherModal teacher={mockTeacher} open={true} onClose={vi.fn()} />
    )

    expect(
      screen.getByRole("heading", {
        name: /ویرایش استاد|Edit Teacher/i,
      })
    ).toBeInTheDocument()

    const phoneInput = document.querySelector(
      'input[name="phone"]'
    ) as HTMLInputElement
    expect(phoneInput).toBeInTheDocument()
    expect(phoneInput.value).toBe("09123334455")
  })

  it("should close without calling mutation if no fields are changed", async () => {
    const mockMutate = vi.fn()
    vi.spyOn(teachersResource.update, "toMutation").mockReturnValue({
      mutationFn: mockMutate,
    } as never)

    const handleClose = vi.fn()
    render(
      <EditTeacherModal
        teacher={mockTeacher}
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
    vi.spyOn(teachersResource.update, "toMutation").mockReturnValue({
      mutationFn: mockMutate,
    } as never)

    render(
      <EditTeacherModal teacher={mockTeacher} open={true} onClose={vi.fn()} />
    )

    const bioInput = document.querySelector(
      'input[name="bio"]'
    ) as HTMLInputElement
    fireEvent.change(bioInput, { target: { value: "Updated bio text" } })

    const submitBtn = screen.getByRole("button", {
      name: /ثبت|ذخیره|submit/i,
    })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "teacher-1",
          body: { bio: "Updated bio text" },
        }),
        expect.anything()
      )
    })
  })

  it("should send avatarUrl: null when photo is removed", async () => {
    const mockMutate = vi.fn()
    vi.spyOn(teachersResource.update, "toMutation").mockReturnValue({
      mutationFn: mockMutate,
    } as never)

    render(
      <EditTeacherModal teacher={mockTeacher} open={true} onClose={vi.fn()} />
    )

    const removeBtn = screen.getByRole("button", {
      name: /حذف تصویر|Remove image/i,
    })
    fireEvent.click(removeBtn)

    const submitBtn = screen.getByRole("button", {
      name: /ثبت|ذخیره|submit/i,
    })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "teacher-1",
          body: { avatarUrl: null },
        }),
        expect.anything()
      )
    })
  })
})
