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

  it("adapts direction based on document direction (ltr vs rtl)", async () => {
    document.documentElement.setAttribute("dir", "ltr")
    const { unmount } = render(<Toaster />)

    act(() => {
      toast("LTR Notification")
    })

    const ltrNotification = await screen.findByText("LTR Notification")
    const ltrToaster = ltrNotification.closest("[data-sonner-toaster]")
    expect(ltrToaster).toHaveAttribute("dir", "ltr")

    unmount()
    toast.dismiss()

    document.documentElement.setAttribute("dir", "rtl")
    render(<Toaster />)

    act(() => {
      toast("RTL Notification")
    })

    const rtlNotification = await screen.findByText("RTL Notification")
    const rtlToaster = rtlNotification.closest("[data-sonner-toaster]")
    expect(rtlToaster).toHaveAttribute("dir", "rtl")
  })

  it("separates different status types with corresponding attributes and styles", async () => {
    render(<Toaster />)

    act(() => {
      toast.success("Success status")
      toast.error("Error status")
      toast.warning("Warning status")
      toast.info("Info status")
    })

    const successEl = await screen.findByText("Success status")
    const errorEl = await screen.findByText("Error status")
    const warningEl = await screen.findByText("Warning status")
    const infoEl = await screen.findByText("Info status")

    expect(successEl.closest("[data-sonner-toast]")).toHaveAttribute(
      "data-type",
      "success"
    )
    expect(errorEl.closest("[data-sonner-toast]")).toHaveAttribute(
      "data-type",
      "error"
    )
    expect(warningEl.closest("[data-sonner-toast]")).toHaveAttribute(
      "data-type",
      "warning"
    )
    expect(infoEl.closest("[data-sonner-toast]")).toHaveAttribute(
      "data-type",
      "info"
    )
  })

  it("passes custom duration as --toast-duration for the linear progress bar", async () => {
    render(<Toaster />)

    act(() => {
      toast.success("Timed notification", { duration: 6000 })
    })

    const notification = await screen.findByText("Timed notification")
    const toastItem = notification.closest("[data-sonner-toast]") as HTMLElement

    expect(toastItem.style.getPropertyValue("--toast-duration")).toBe("6000ms")
  })

  it("disables duration countdown for loading toasts", async () => {
    render(<Toaster />)

    act(() => {
      toast.loading("Loading data...")
    })

    const notification = await screen.findByText("Loading data...")
    const toastItem = notification.closest("[data-sonner-toast]") as HTMLElement

    expect(toastItem).toHaveAttribute("data-type", "loading")
    expect(toastItem.style.getPropertyValue("--toast-duration")).toBe("0ms")
  })

  it("configures safe-area-inset aware offsets by default", async () => {
    render(<Toaster />)

    act(() => {
      toast("Safe area notification")
    })

    const notification = await screen.findByText("Safe area notification")
    const toaster = notification.closest("[data-sonner-toaster]") as HTMLElement

    expect(toaster.style.getPropertyValue("--offset-bottom")).toBe(
      "calc(2rem + env(safe-area-inset-bottom, 0px))"
    )
    expect(toaster.style.getPropertyValue("--mobile-offset-bottom")).toBe(
      "calc(1rem + env(safe-area-inset-bottom, 0px))"
    )
    expect(toaster.style.getPropertyValue("--offset-top")).toBe(
      "calc(2rem + env(safe-area-inset-top, 0px))"
    )
    expect(toaster.style.getPropertyValue("--mobile-offset-top")).toBe(
      "calc(1rem + env(safe-area-inset-top, 0px))"
    )
    expect(toaster.style.getPropertyValue("--offset-left")).toBe(
      "calc(2rem + env(safe-area-inset-left, 0px))"
    )
    expect(toaster.style.getPropertyValue("--mobile-offset-left")).toBe(
      "calc(1rem + env(safe-area-inset-left, 0px))"
    )
    expect(toaster.style.getPropertyValue("--offset-right")).toBe(
      "calc(2rem + env(safe-area-inset-right, 0px))"
    )
    expect(toaster.style.getPropertyValue("--mobile-offset-right")).toBe(
      "calc(1rem + env(safe-area-inset-right, 0px))"
    )
  })

  it("allows custom offset overrides while preserving safe defaults", async () => {
    render(
      <Toaster
        mobileOffset={{
          bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      />
    )

    act(() => {
      toast("Custom offset notification")
    })

    const notification = await screen.findByText("Custom offset notification")
    const toaster = notification.closest("[data-sonner-toaster]") as HTMLElement

    expect(toaster.style.getPropertyValue("--mobile-offset-bottom")).toBe(
      "calc(5.5rem + env(safe-area-inset-bottom, 0px))"
    )
    expect(toaster.style.getPropertyValue("--mobile-offset-top")).toBe(
      "calc(1rem + env(safe-area-inset-top, 0px))"
    )
  })
})
