import { describe, it, expect } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { SlotCard } from "../components/slot-card"
import type { PhaseGeneratedSlot } from "@workspace/types"

describe("SlotCard Component", () => {
  const mockSlot: PhaseGeneratedSlot = {
    slotNumber: 1,
    startTime: "15:00",
    endTime: "16:30",
    durationMinutes: 90,
  }

  it("renders slot label with زمان instead of تایم, bold start and end time, and duration in minutes with دقیقه instead of m", () => {
    const { container } = render(<SlotCard slot={mockSlot} />)

    // Slot label uses 'زمان'
    expect(screen.getByText(/زمان 1|زمان ۱/i)).toBeInTheDocument()

    // Does NOT render 'تایم'
    expect(screen.queryByText(/تایم/i)).not.toBeInTheDocument()

    // Start and end time is in bold
    const timeRange = screen.getByText(/15:00 الی 16:30|۱۵:۰۰ الی ۱۶:۳۰/i)
    expect(timeRange).toBeInTheDocument()
    expect(timeRange.className).toContain("font-bold")

    // Duration badge uses 'دقیقه'
    expect(screen.getByText(/90 دقیقه|۹۰ دقیقه/i)).toBeInTheDocument()

    // Does NOT render raw '90m'
    expect(screen.queryByText("90m")).not.toBeInTheDocument()

    // Card has spacious classes
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain("min-h-14")
    expect(card.className).toContain("rounded-2xl")
  })
})
