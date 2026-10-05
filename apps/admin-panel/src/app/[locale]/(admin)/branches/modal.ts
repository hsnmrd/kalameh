import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  createBranch: dynamic(
    () =>
      import("./components/create-branch-modal").then(
        (m) => m.CreateBranchModal
      ),
    { ssr: false }
  ),
  editBranch: dynamic(
    () =>
      import("./components/edit-branch-modal").then((m) => m.EditBranchModal),
    { ssr: false }
  ),
}
