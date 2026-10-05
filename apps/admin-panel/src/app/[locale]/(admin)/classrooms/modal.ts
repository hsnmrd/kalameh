import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  createClassroom: dynamic(
    () =>
      import("./components/create-classroom-modal").then(
        (m) => m.CreateClassroomModal
      ),
    { ssr: false }
  ),
  editClassroom: dynamic(
    () =>
      import("./components/edit-classroom-modal").then(
        (m) => m.EditClassroomModal
      ),
    { ssr: false }
  ),
  deleteClassroom: dynamic(
    () =>
      import("./components/delete-classroom-modal").then(
        (m) => m.DeleteClassroomModal
      ),
    { ssr: false }
  ),
}
