import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  createPhase: dynamic(
    () =>
      import("./components/create-operating-phase-modal").then(
        (m) => m.CreateOperatingPhaseModal
      ),
    { ssr: false }
  ),
  editPhase: dynamic(
    () =>
      import("./components/edit-operating-phase-modal").then(
        (m) => m.EditOperatingPhaseModal
      ),
    { ssr: false }
  ),
  deletePhase: dynamic(
    () =>
      import("./components/delete-operating-phase-modal").then(
        (m) => m.DeleteOperatingPhaseModal
      ),
    { ssr: false }
  ),
}
