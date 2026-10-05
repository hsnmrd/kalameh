import * as React from "react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ModalGateway } from "../index"
import { useModalStore } from "@/lib/stores/modal"

const mockPush = vi.fn()
let currentSearchParams = new URLSearchParams()

vi.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => "/fa/classes",
}))

function DummyCreateModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div data-testid="create-modal">
      <h1>Create Class Modal</h1>
      <button onClick={onClose}>Close Create</button>
    </div>
  )
}

function DummyEditModal({
  open,
  onClose,
  data,
}: {
  open: boolean
  onClose: () => void
  data?: { id: string; title: string }
}) {
  if (!open) return null
  return (
    <div data-testid="edit-modal">
      <h1>Edit Class: {data?.title}</h1>
      <span>ID: {data?.id}</span>
      <button onClick={onClose}>Close Edit</button>
    </div>
  )
}

const registry = {
  createClass: DummyCreateModal,
  editClass: DummyEditModal,
}

describe("ModalGateway Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentSearchParams = new URLSearchParams()
    useModalStore.getState().clearAllModalData()
  })

  it("renders empty fragment when no modals are active in URL", () => {
    const { container } = render(<ModalGateway registry={registry} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders active modal from registry when URL param matches", () => {
    currentSearchParams = new URLSearchParams("modal=createClass")
    render(<ModalGateway registry={registry} />)

    expect(screen.getByTestId("create-modal")).toBeInTheDocument()
    expect(screen.getByText("Create Class Modal")).toBeInTheDocument()
    expect(screen.queryByTestId("edit-modal")).not.toBeInTheDocument()
  })

  it("passes persisted data from store to the active modal", () => {
    currentSearchParams = new URLSearchParams("modal=editClass")
    useModalStore
      .getState()
      .setModalData("editClass", { id: "class-42", title: "Physics 101" })

    render(<ModalGateway registry={registry} />)

    expect(screen.getByTestId("edit-modal")).toBeInTheDocument()
    expect(screen.getByText("Edit Class: Physics 101")).toBeInTheDocument()
    expect(screen.getByText("ID: class-42")).toBeInTheDocument()
  })

  it("handles multiple modals active simultaneously", () => {
    currentSearchParams = new URLSearchParams("modal=createClass,editClass")
    useModalStore
      .getState()
      .setModalData("editClass", { id: "99", title: "Chemistry" })

    render(<ModalGateway registry={registry} />)

    expect(screen.getByTestId("create-modal")).toBeInTheDocument()
    expect(screen.getByTestId("edit-modal")).toBeInTheDocument()
  })

  it("ignores active modal keys that are not registered in the gateway", () => {
    currentSearchParams = new URLSearchParams("modal=unregisteredModal")
    const { container } = render(<ModalGateway registry={registry} />)

    expect(container.firstChild).toBeNull()
  })

  it("calls onClose and removes modal from URL when close button is clicked", () => {
    currentSearchParams = new URLSearchParams("modal=createClass")
    const onModalClose = vi.fn()

    render(<ModalGateway registry={registry} onClose={onModalClose} />)

    fireEvent.click(screen.getByText("Close Create"))

    expect(onModalClose).toHaveBeenCalledWith("createClass")
    expect(mockPush).toHaveBeenCalledWith("/fa/classes", { scroll: false })
  })
})
