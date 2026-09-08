import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"

describe("shared AlertDialog component kit", () => {
  it("renders trigger and opens alert dialog content when clicked", () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open confirmation</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()

    const trigger = screen.getByRole("button", { name: /Open confirmation/i })
    fireEvent.click(trigger)

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /Confirm deletion/i })
    ).toBeInTheDocument()
    expect(
      screen.getByText("Are you sure you want to delete this item?")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument()
  })

  it("calls action handler when AlertDialogAction is clicked", () => {
    const handleAction = vi.fn()
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Prompt</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const confirmButton = screen.getByRole("button", { name: /Confirm/i })
    fireEvent.click(confirmButton)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it("calls onOpenChange with false when AlertDialogCancel is clicked", () => {
    const handleOpenChange = vi.fn()
    render(
      <AlertDialog open onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Prompt</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const cancelButton = screen.getByRole("button", { name: /Cancel/i })
    fireEvent.click(cancelButton)
    expect(handleOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })
})
