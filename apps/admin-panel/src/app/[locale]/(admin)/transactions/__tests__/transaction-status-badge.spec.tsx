import { describe, expect, it } from "vitest"
import { screen, render } from "../../../../../test/test-utils"
import { TRANSACTION_STATUSES } from "@workspace/types"
import { TransactionStatusBadge } from "../components/transaction-status-badge"

describe("TransactionStatusBadge", () => {
  it.each([
    [TRANSACTION_STATUSES.PENDING, /در انتظار بررسی/i],
    [TRANSACTION_STATUSES.APPROVED, /تأیید شده/i],
    [TRANSACTION_STATUSES.REJECTED, /رد شده/i],
  ])("renders the localized %s status", (status, label) => {
    render(<TransactionStatusBadge status={status} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
