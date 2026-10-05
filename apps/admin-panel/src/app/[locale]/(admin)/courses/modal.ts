import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  createCourse: dynamic(
    () =>
      import("./components/create-course-modal").then(
        (m) => m.CreateCourseModal
      ),
    { ssr: false }
  ),
  editCourse: dynamic(
    () =>
      import("./components/edit-course-modal").then((m) => m.EditCourseModal),
    { ssr: false }
  ),
}
