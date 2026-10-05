import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  createInstitute: dynamic(
    () =>
      import("./components/create-institute-modal").then(
        (m) => m.CreateInstituteModal
      ),
    { ssr: false }
  ),
  editInstitute: dynamic(
    () =>
      import("./components/edit-institute-modal").then(
        (m) => m.EditInstituteModal
      ),
    { ssr: false }
  ),
  deleteInstitute: dynamic(
    () =>
      import("./components/delete-institute-modal").then(
        (m) => m.DeleteInstituteModal
      ),
    { ssr: false }
  ),
}
