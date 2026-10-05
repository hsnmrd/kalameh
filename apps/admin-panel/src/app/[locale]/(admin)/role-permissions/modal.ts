import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  resetRole: dynamic(
    () => import("./components/reset-role-modal").then((m) => m.ResetRoleModal),
    { ssr: false }
  ),
}
