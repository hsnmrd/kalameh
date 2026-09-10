import { describe, it, expect } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { PhaseRemainderWarning } from "../components/phase-remainder-warning"
import type { PhaseSlotsCalculationResult } from "@workspace/types"

describe("PhaseRemainderWarning Component", () => {
  it("renders nothing when calculation is null or hasWarning is false", () => {
    const { container: container1 } = render(
      <PhaseRemainderWarning calculation={null} />
    )
    expect(container1).toBeEmptyDOMElement()

    const noWarningCalc: PhaseSlotsCalculationResult = {
      totalSpanMinutes: 360,
      instructionalMinutes: 360,
      fullSlotsCount: 4,
      remainderMinutes: 0,
      slots: [],
      hasWarning: false,
    }

    const { container: container2 } = render(
      <PhaseRemainderWarning calculation={noWarningCalc} />
    )
    expect(container2).toBeEmptyDOMElement()
  })

  it("renders alert with warning message when hasWarning is true", () => {
    const warningCalc: PhaseSlotsCalculationResult = {
      totalSpanMinutes: 375,
      instructionalMinutes: 360,
      fullSlotsCount: 4,
      remainderMinutes: 15,
      slots: [],
      hasWarning: true,
      warningMessageFa: "15 دقیقه زمان مازاد در پایان فاز باقی می‌ماند.",
      warningMessageEn: "Leaving a remainder of 15 minutes.",
    }

    render(<PhaseRemainderWarning calculation={warningCalc} />)

    const alert = screen.getByRole("alert")
    expect(alert).toBeInTheDocument()
    expect(
      screen.getByText("15 دقیقه زمان مازاد در پایان فاز باقی می‌ماند.")
    ).toBeInTheDocument()
  })

  it("falls back to remainderWarning message when warningMessageFa is missing", () => {
    const warningCalc: PhaseSlotsCalculationResult = {
      totalSpanMinutes: 375,
      instructionalMinutes: 360,
      fullSlotsCount: 4,
      remainderMinutes: 15,
      slots: [],
      hasWarning: true,
    }

    render(
      <PhaseRemainderWarning
        calculation={warningCalc}
        slotDurationMinutes={90}
      />
    )

    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByText(/15 دقیقه زمان مازاد/i)).toBeInTheDocument()
  })
})
