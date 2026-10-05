import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  createTeacher: dynamic(
    () =>
      import("./components/create-teacher-modal").then(
        (m) => m.CreateTeacherModal
      ),
    { ssr: false }
  ),
  viewProfileTeacher: dynamic(
    () =>
      import("./components/teacher-profile-modal").then(
        (m) => m.TeacherProfileModal
      ),
    { ssr: false }
  ),
  availabilityTeacher: dynamic(
    () =>
      import("./components/teacher-availability-modal").then(
        (m) => m.TeacherAvailabilityModal
      ),
    { ssr: false }
  ),
  editTeacher: dynamic(
    () =>
      import("./components/edit-teacher-modal").then((m) => m.EditTeacherModal),
    { ssr: false }
  ),
  resetPasswordTeacher: dynamic(
    () =>
      import("./components/reset-password-modal").then(
        (m) => m.ResetPasswordModal
      ),
    { ssr: false }
  ),
  deleteTeacher: dynamic(
    () =>
      import("./components/delete-teacher-modal").then(
        (m) => m.DeleteTeacherModal
      ),
    { ssr: false }
  ),
}
