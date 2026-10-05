import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  createTerm: dynamic(
    () =>
      import("./components/create-term-modal").then((m) => m.CreateTermModal),
    { ssr: false }
  ),
  viewTerm: dynamic(
    () => import("./components/view-term-modal").then((m) => m.ViewTermModal),
    { ssr: false }
  ),
  editTerm: dynamic(
    () => import("./components/edit-term-modal").then((m) => m.EditTermModal),
    { ssr: false }
  ),
  deleteTerm: dynamic(
    () =>
      import("./components/delete-term-modal").then((m) => m.DeleteTermModal),
    { ssr: false }
  ),
}
