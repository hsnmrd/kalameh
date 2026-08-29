import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Toaster, toast } from "@workspace/ui/components/sonner"

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light" }),
}))

describe("shared Toaster", () => {
  afterEach(() => {
    toast.dismiss()
  })

  it("renders notifications at the bottom center by default", async () => {
    render(<Toaster />)

    act(() => {
      toast("Saved")
    })

    const notification = await screen.findByText("Saved")
    const toaster = notification.closest("[data-sonner-toaster]")

    expect(toaster).toHaveAttribute("data-y-position", "bottom")
    expect(toaster).toHaveAttribute("data-x-position", "center")
  })

  it("dismisses only the clicked notification immediately", async () => {
    render(<Toaster />)

    act(() => {
      toast("First notification")
      toast("Second notification")
    })

    const firstNotification = await screen.findByText("First notification")
    const secondNotification = await screen.findByText("Second notification")

    fireEvent.click(firstNotification)

    await waitFor(() => {
      expect(firstNotification.closest("[data-sonner-toast]")).toHaveAttribute(
        "data-removed",
        "true"
      )
    })
    expect(secondNotification.closest("[data-sonner-toast]")).toHaveAttribute(
      "data-removed",
      "false"
    )
  })
})
