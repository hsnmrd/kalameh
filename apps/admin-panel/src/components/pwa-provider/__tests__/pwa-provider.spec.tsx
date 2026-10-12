import { describe, it, expect } from "vitest"
import { render, screen } from "../../../test/test-utils"
import { PwaProvider, usePwaContext } from "../index"

function TestConsumer() {
  const { isSupported, isInstalled, isInstallable } = usePwaContext()
  return (
    <div>
      <span data-testid="supported">{String(isSupported)}</span>
      <span data-testid="installed">{String(isInstalled)}</span>
      <span data-testid="installable">{String(isInstallable)}</span>
    </div>
  )
}

describe("PwaProvider", () => {
  it("renders children and provides default PWA context", () => {
    render(
      <PwaProvider>
        <TestConsumer />
      </PwaProvider>
    )

    expect(screen.getByTestId("installed")).toHaveTextContent("false")
    expect(screen.getByTestId("installable")).toHaveTextContent("false")
  })
})
