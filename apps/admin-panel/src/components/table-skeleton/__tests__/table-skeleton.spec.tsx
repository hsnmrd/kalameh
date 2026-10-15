import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { TableSkeleton } from "../index"

describe("TableSkeleton Component", () => {
  it("renders specified number of skeleton rows and status indicator", () => {
    const { container } = render(<TableSkeleton rows={4} />)

    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument()
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()

    // 4 rows in body
    const bodyRows = container.querySelectorAll(".divide-y > div")
    expect(bodyRows).toHaveLength(4)
  })
})
