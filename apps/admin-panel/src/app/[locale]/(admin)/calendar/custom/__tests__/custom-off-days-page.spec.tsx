import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/test-utils"
import CustomOffDaysPage from "../page"

vi.mock("../components/custom-off-days-content", () => ({
  CustomOffDaysContent: () => <div data-testid="custom-off-days-content" />,
}))

describe("CustomOffDaysPage", () => {
  it("renders the custom off-days settings", () => {
    render(<CustomOffDaysPage />)
    expect(screen.getByTestId("custom-off-days-content")).toBeInTheDocument()
  })
})
