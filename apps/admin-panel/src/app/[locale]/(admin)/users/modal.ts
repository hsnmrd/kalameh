import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  createUser: dynamic(
    () =>
      import("./components/create-user-modal").then((m) => m.CreateUserModal),
    { ssr: false }
  ),
  importUsers: dynamic(
    () =>
      import("./components/import-users-modal").then((m) => m.ImportUsersModal),
    { ssr: false }
  ),
  profileUser: dynamic(
    () =>
      import("./components/user-profile-modal").then((m) => m.UserProfileModal),
    { ssr: false }
  ),
  editUser: dynamic(
    () => import("./components/edit-user-modal").then((m) => m.EditUserModal),
    { ssr: false }
  ),
  resetPasswordUser: dynamic(
    () =>
      import("./components/reset-password-modal").then(
        (m) => m.ResetPasswordModal
      ),
    { ssr: false }
  ),
  deleteUser: dynamic(
    () =>
      import("./components/delete-user-modal").then((m) => m.DeleteUserModal),
    { ssr: false }
  ),
}
