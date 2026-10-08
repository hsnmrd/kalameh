import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useModal } from "../index"
import { useModalStore } from "@/lib/stores/modal"

const mockPush = vi.fn()
const mockReplace = vi.fn()
let currentSearchParams = new URLSearchParams()
let currentPathname = "/fa/classes"

vi.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => currentPathname,
}))

describe("useModal hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentSearchParams = new URLSearchParams()
    currentPathname = "/fa/classes"
    useModalStore.getState().clearAllModalData()
  })

  it("detects when no modals are active", () => {
    const { result } = renderHook(() => useModal())
    expect(result.current.activeModals).toEqual([])
    expect(result.current.isModalOpen("createClass")).toBe(false)
  })

  it("detects single active modal from URL", () => {
    currentSearchParams = new URLSearchParams("modal=createClass")
    const { result } = renderHook(() => useModal())

    expect(result.current.activeModals).toEqual(["createClass"])
    expect(result.current.isModalOpen("createClass")).toBe(true)
    expect(result.current.isModalOpen("editClass")).toBe(false)
  })

  it("detects multiple active modals from comma-separated URL param", () => {
    currentSearchParams = new URLSearchParams("modal=editClass,deleteConfirm")
    const { result } = renderHook(() => useModal())

    expect(result.current.activeModals).toEqual(["editClass", "deleteConfirm"])
    expect(result.current.isModalOpen("editClass")).toBe(true)
    expect(result.current.isModalOpen("deleteConfirm")).toBe(true)
  })

  it("opens modal and updates router and store with data", () => {
    const { result } = renderHook(() => useModal())
    const data = { id: "c1", title: "Level 1" }

    act(() => {
      result.current.openModal("editClass", data)
    })

    expect(mockPush).toHaveBeenCalledWith("/fa/classes?modal=editClass", {
      scroll: false,
    })
    expect(useModalStore.getState().getModalData("editClass")).toEqual(data)
  })

  it("stacks an additional modal key when one is already active", () => {
    currentSearchParams = new URLSearchParams("modal=editClass&filter=active")
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal("deleteConfirm")
    })

    expect(mockPush).toHaveBeenCalledWith(
      "/fa/classes?modal=editClass%2CdeleteConfirm&filter=active",
      { scroll: false }
    )
  })

  it("closes a specific modal and removes it from query param and store", () => {
    currentSearchParams = new URLSearchParams("modal=editClass,deleteConfirm")
    useModalStore.getState().setModalData("deleteConfirm", { reason: "test" })
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.closeModal("deleteConfirm")
    })

    expect(mockPush).toHaveBeenCalledWith("/fa/classes?modal=editClass", {
      scroll: false,
    })
    expect(
      useModalStore.getState().getModalData("deleteConfirm")
    ).toBeUndefined()
  })

  it("clears modal query param when all modals are closed", () => {
    currentSearchParams = new URLSearchParams("modal=createClass&search=test")
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.closeModal("createClass")
    })

    expect(mockPush).toHaveBeenCalledWith("/fa/classes?search=test", {
      scroll: false,
    })
  })

  it("supports scoped mode useModal(modalKey)", () => {
    currentSearchParams = new URLSearchParams("modal=editUser")
    useModalStore.getState().setModalData("editUser", { userId: "u123" })

    const { result } = renderHook(() =>
      useModal<{ userId: string }>("editUser")
    )

    expect(result.current.isOpen).toBe(true)
    expect(result.current.data).toEqual({ userId: "u123" })

    act(() => {
      result.current.close()
    })

    expect(mockPush).toHaveBeenCalledWith("/fa/classes", { scroll: false })
  })

  it("exposes transition pending state and helpers", () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.isPending).toBe(false)
    expect(result.current.pendingModal).toBeNull()
    expect(result.current.isModalPending()).toBe(false)
    expect(result.current.isModalPending("createInstitute")).toBe(false)
  })
})
