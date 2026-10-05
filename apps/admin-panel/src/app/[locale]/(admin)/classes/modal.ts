import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  createClass: dynamic(
    () =>
      import("./components/create-class-modal").then((m) => m.CreateClassModal),
    { ssr: false }
  ),
  editClass: dynamic(
    () => import("./components/edit-class-modal").then((m) => m.EditClassModal),
    { ssr: false }
  ),
  classDetails: dynamic(
    () =>
      import("./components/class-details-modal").then(
        (m) => m.ClassDetailsModal
      ),
    { ssr: false }
  ),
  deleteClass: dynamic(
    () =>
      import("./components/delete-class-modal").then((m) => m.DeleteClassModal),
    { ssr: false }
  ),
}
