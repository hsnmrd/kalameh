import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { ModalProvider, useModalTransition } from "../index"
import { ModalLoadingBar } from "../modal-loading-bar"

function TestConsumer({
  onTrigger,
}: {
  onTrigger?: (start: (key: string, cb: () => void) => void) => void
}) {
  const { isPending, pendingModal, startModalTransition } = useModalTransition()

  React.useEffect(() => {
    onTrigger?.(startModalTransition)
  }, [onTrigger, startModalTransition])

  return (
    <div>
      <span data-testid="pending-status">{isPending ? "loading" : "idle"}</span>
      <span data-testid="pending-modal">{pendingModal ?? "none"}</span>
    </div>
  )
}

describe("ModalProvider and useModalTransition", () => {
  it("renders children properly", () => {
    render(
      <ModalProvider>
        <div>Content Inside Provider</div>
      </ModalProvider>
    )

    expect(screen.getByText("Content Inside Provider")).toBeInTheDocument()
  })

  it("provides initial idle transition state", () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )

    expect(screen.getByTestId("pending-status")).toHaveTextContent("idle")
    expect(screen.getByTestId("pending-modal")).toHaveTextContent("none")
  })

  it("handles modal transition lifecycle", async () => {
    let triggerTransition: ((key: string, cb: () => void) => void) | undefined

    render(
      <ModalProvider>
        <TestConsumer
          onTrigger={(trigger) => {
            triggerTransition = trigger
          }}
        />
      </ModalProvider>
    )

    const callback = vi.fn()

    act(() => {
      triggerTransition?.("createInstitute", callback)
    })

    expect(callback).toHaveBeenCalled()
  })

  it("gracefully falls back when used outside ModalProvider", () => {
    render(<TestConsumer />)

    expect(screen.getByTestId("pending-status")).toHaveTextContent("idle")
    expect(screen.getByTestId("pending-modal")).toHaveTextContent("none")
  })
})

describe("ModalLoadingBar", () => {
  it("renders nothing when isPending is false", () => {
    const { container } = render(<ModalLoadingBar isPending={false} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders loading bar when isPending is true", () => {
    render(<ModalLoadingBar isPending={true} />)
    const progressbar = screen.getByRole("progressbar")
    expect(progressbar).toBeInTheDocument()
    expect(progressbar).toHaveAttribute("aria-busy", "true")
  })
})
