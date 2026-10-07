import { describe, expect, it, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import OffDaysPage from "../page"

vi.mock("../components/off-days-content", () => ({
  OffDaysContent: () => <div data-testid="off-days-content" />,
}))

describe("OffDaysPage", () => {
  it("renders the institute off-days configuration", () => {
    render(<OffDaysPage />)

    expect(screen.getByTestId("off-days-content")).toBeInTheDocument()
  })
})
