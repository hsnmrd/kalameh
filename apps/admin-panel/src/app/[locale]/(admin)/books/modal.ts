import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  createBook: dynamic(
    () =>
      import("./components/create-book-modal").then((m) => m.CreateBookModal),
    { ssr: false }
  ),
  editBook: dynamic(
    () => import("./components/edit-book-modal").then((m) => m.EditBookModal),
    { ssr: false }
  ),
  deleteBook: dynamic(
    () =>
      import("./components/delete-book-modal").then((m) => m.DeleteBookModal),
    { ssr: false }
  ),
  generateCourses: dynamic(
    () =>
      import("./components/generate-courses-modal").then(
        (m) => m.GenerateCoursesModal
      ),
    { ssr: false }
  ),
}
