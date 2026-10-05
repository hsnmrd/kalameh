import dynamic from "next/dynamic"
import type { ModalRegistry } from "@/components/modal-gateway"

export const modalRegistry: ModalRegistry = {
  reviewTransaction: dynamic(
    () =>
      import("./components/review-transaction-modal").then(
        (m) => m.ReviewTransactionModal
      ),
    { ssr: false }
  ),
}
