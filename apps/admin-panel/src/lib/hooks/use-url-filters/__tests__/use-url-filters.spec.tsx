import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useUrlFilters } from "../index"

const mockReplace = vi.fn((url: string) => {
  const query = url.includes("?") ? url.split("?")[1] : ""
  mockSearchParams = new URLSearchParams(query)
})
let mockSearchParams = new URLSearchParams()
let mockPathname = "/classes"

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => mockPathname,
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}))

describe("useUrlFilters hook", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockReplace.mockClear()
    mockSearchParams = new URLSearchParams()
    mockPathname = "/classes"
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("initializes with defaultValues when searchParams is empty", () => {
    const { result } = renderHook(() =>
      useUrlFilters({
        defaultValues: {
          search: "",
          status: "ALL",
          page: 1,
          pageSize: 10,
        },
      })
    )

    expect(result.current.values.search).toBe("")
    expect(result.current.values.status).toBe("ALL")
    expect(result.current.values.page).toBe(1)
    expect(result.current.values.pageSize).toBe(10)
    expect(result.current.pageIndex).toBe(0)
    expect(result.current.pageSize).toBe(10)
  })

  it("reads initial values from searchParams correctly", () => {
    mockSearchParams = new URLSearchParams(
      "search=math&status=ACTIVE&page=3&pageSize=20&modal=create"
    )

    const { result } = renderHook(() =>
      useUrlFilters({
        defaultValues: {
          search: "",
          status: "ALL",
          page: 1,
          pageSize: 10,
        },
      })
    )

    expect(result.current.values.search).toBe("math")
    expect(result.current.values.status).toBe("ACTIVE")
    expect(result.current.values.page).toBe(3)
    expect(result.current.values.pageSize).toBe(20)
    expect(result.current.pageIndex).toBe(2)
  })

  it("immediately updates discrete filters and resets page to 1", () => {
    mockSearchParams = new URLSearchParams("page=3")

    const { result } = renderHook(() =>
      useUrlFilters({
        defaultValues: {
          search: "",
          status: "ALL",
          page: 1,
          pageSize: 10,
        },
      })
    )

    act(() => {
      result.current.setValue("status", "ACTIVE")
    })

    expect(result.current.values.status).toBe("ACTIVE")
    expect(result.current.values.page).toBe(1)
    expect(result.current.pageIndex).toBe(0)

    expect(mockReplace).toHaveBeenCalledWith("/classes?status=ACTIVE", {
      scroll: false,
    })
  })

  it("debounces search update to URL", () => {
    const { result } = renderHook(() =>
      useUrlFilters({
        defaultValues: {
          search: "",
          status: "ALL",
          page: 1,
          pageSize: 10,
        },
      })
    )

    act(() => {
      result.current.setValue("search", "physics")
    })

    // Immediate in React state
    expect(result.current.values.search).toBe("physics")
    // But router.replace not yet called before timer
    expect(mockReplace).not.toHaveBeenCalled()

    // Fast-forward debounce timer
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(mockReplace).toHaveBeenCalledWith("/classes?search=physics", {
      scroll: false,
    })
  })

  it("preserves non-filter query parameters (like modal)", () => {
    mockSearchParams = new URLSearchParams("modal=editClass&foo=bar")

    const { result } = renderHook(() =>
      useUrlFilters({
        defaultValues: {
          search: "",
          status: "ALL",
          page: 1,
          pageSize: 10,
        },
      })
    )

    act(() => {
      result.current.setPageIndex(1) // page 2
    })

    expect(result.current.values.page).toBe(2)
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("modal=editClass"),
      { scroll: false }
    )
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("page=2"),
      { scroll: false }
    )
  })
})
