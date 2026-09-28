import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

describe("shared Tooltip component kit", () => {
  it("renders tooltip trigger", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Help text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

    expect(
      screen.getByRole("button", { name: /hover me/i })
    ).toBeInTheDocument()
  })

  it("renders tooltip content when defaultOpen is true", () => {
    render(
      <Tooltip defaultOpen>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent>Visible tooltip text</TooltipContent>
      </Tooltip>
    )

    expect(screen.getByText("Visible tooltip text")).toBeInTheDocument()
  })
})
