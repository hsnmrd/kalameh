import type { ModalRegistry } from "@/components/modal-gateway"
import { AddOffDayModal } from "./components/custom-off-days-content/add-off-day-modal"
import { DeleteOffDayModal } from "./components/custom-off-days-content/delete-off-day-modal"

export const modalRegistry: ModalRegistry = {
  addOffDay: AddOffDayModal,
  deleteOffDay: DeleteOffDayModal,
}
