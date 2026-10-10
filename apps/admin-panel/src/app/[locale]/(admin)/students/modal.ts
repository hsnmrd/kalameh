import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  createStudent: dynamic(
    () =>
      import("./components/create-student-modal").then(
        (m) => m.CreateStudentModal
      ),
    { ssr: false }
  ),
  importStudents: dynamic(
    () =>
      import("./components/import-students-modal").then(
        (m) => m.ImportStudentsModal
      ),
    { ssr: false }
  ),
  editStudent: dynamic(
    () =>
      import("./components/edit-student-modal").then((m) => m.EditStudentModal),
    { ssr: false }
  ),
  profileStudent: dynamic(
    () =>
      import("./components/student-profile-modal").then(
        (m) => m.StudentProfileModal
      ),
    { ssr: false }
  ),
  availabilityStudent: dynamic(
    () =>
      import("./components/student-availability-modal").then(
        (m) => m.StudentAvailabilityModal
      ),
    { ssr: false }
  ),
  setAllAvailable: dynamic(
    () =>
      import("./components/set-all-available-dialog").then(
        (m) => m.SetAllAvailableDialog
      ),
    { ssr: false }
  ),
  resetPassword: dynamic(
    () =>
      import("./components/reset-password-modal").then(
        (m) => m.ResetPasswordModal
      ),
    { ssr: false }
  ),
  addNote: dynamic(
    () =>
      import("./components/add-student-note-modal").then(
        (m) => m.AddStudentNoteModal
      ),
    { ssr: false }
  ),
}
