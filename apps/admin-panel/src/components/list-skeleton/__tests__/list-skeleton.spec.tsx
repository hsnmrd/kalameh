import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { ListSkeleton } from "../index"

describe("ListSkeleton Component", () => {
  it("renders specified number of skeleton rows", () => {
    const { container } = render(<ListSkeleton rows={3} />)

    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument()
    const rows = container.querySelectorAll(".divide-y > div")
    expect(rows).toHaveLength(3)
  })
})
