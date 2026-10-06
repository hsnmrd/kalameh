import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useNavTransition } from "../index"

const mockPush = vi.fn()

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe("useNavTransition Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createMockEvent(
    overrides: Partial<React.MouseEvent<HTMLAnchorElement>> = {}
  ) {
    return {
      defaultPrevented: false,
      button: 0,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
      ...overrides,
    } as unknown as React.MouseEvent<HTMLAnchorElement>
  }

  it("should trigger router.push and prevent default on standard click", () => {
    const { result } = renderHook(() => useNavTransition("/classes"))
    const event = createMockEvent()

    act(() => {
      result.current.navigate(event, "/students")
    })

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith("/students")
  })

  it("should not intercept click if modifier key (ctrl/cmd) is pressed", () => {
    const { result } = renderHook(() => useNavTransition("/classes"))
    const event = createMockEvent({ ctrlKey: true })

    act(() => {
      result.current.navigate(event, "/students")
    })

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("should not intercept click if non-primary mouse button is clicked", () => {
    const { result } = renderHook(() => useNavTransition("/classes"))
    const event = createMockEvent({ button: 1 }) // middle click

    act(() => {
      result.current.navigate(event, "/students")
    })

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("should not trigger router.push if already on the destination pathname", () => {
    const { result } = renderHook(() => useNavTransition("/classes"))
    const event = createMockEvent()

    act(() => {
      result.current.navigate(event, "/classes")
    })

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("should invoke onAfterClick callback when supplied", () => {
    const { result } = renderHook(() => useNavTransition("/classes"))
    const onAfterClick = vi.fn()
    const event = createMockEvent()

    act(() => {
      result.current.navigate(event, "/teachers", onAfterClick)
    })

    expect(onAfterClick).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith("/teachers")
  })

  it("should clear pending state when pathname updates", () => {
    const { result, rerender } = renderHook(
      ({ pathname }) => useNavTransition(pathname),
      { initialProps: { pathname: "/classes" } }
    )

    const event = createMockEvent()
    act(() => {
      result.current.navigate(event, "/students")
    })

    rerender({ pathname: "/students" })
    expect(result.current.isHrefPending("/students")).toBe(false)
  })
})
