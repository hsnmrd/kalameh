import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useClientPagination } from "../index"

describe("useClientPagination", () => {
  const sampleItems = Array.from({ length: 25 }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Item ${i + 1}`,
  }))

  it("initializes with default pageSize = 10 and pageIndex = 0", () => {
    const { result } = renderHook(() =>
      useClientPagination({ data: sampleItems })
    )

    expect(result.current.pageIndex).toBe(0)
    expect(result.current.pageSize).toBe(10)
    expect(result.current.totalItems).toBe(25)
    expect(result.current.pageCount).toBe(3)
    expect(result.current.paginatedData).toHaveLength(10)
    expect(result.current.paginatedData[0]?.id).toBe("item-1")
    expect(result.current.paginatedData[9]?.id).toBe("item-10")
  })

  it("correctly slices items for subsequent pages", () => {
    const { result } = renderHook(() =>
      useClientPagination({ data: sampleItems, pageSize: 10 })
    )

    act(() => {
      result.current.setPageIndex(1)
    })

    expect(result.current.pageIndex).toBe(1)
    expect(result.current.paginatedData).toHaveLength(10)
    expect(result.current.paginatedData[0]?.id).toBe("item-11")
    expect(result.current.paginatedData[9]?.id).toBe("item-20")

    act(() => {
      result.current.setPageIndex(2)
    })

    expect(result.current.pageIndex).toBe(2)
    expect(result.current.paginatedData).toHaveLength(5)
    expect(result.current.paginatedData[0]?.id).toBe("item-21")
    expect(result.current.paginatedData[4]?.id).toBe("item-25")
  })

  it("handles undefined and empty data", () => {
    const { result: emptyResult } = renderHook(() =>
      useClientPagination({ data: [] })
    )
    expect(emptyResult.current.totalItems).toBe(0)
    expect(emptyResult.current.pageCount).toBe(1)
    expect(emptyResult.current.paginatedData).toEqual([])

    const { result: undefinedResult } = renderHook(() =>
      useClientPagination({ data: undefined })
    )
    expect(undefinedResult.current.totalItems).toBe(0)
    expect(undefinedResult.current.pageCount).toBe(1)
    expect(undefinedResult.current.paginatedData).toEqual([])
  })

  it("clamps pageIndex when data is reduced", () => {
    let items = sampleItems
    const { result, rerender } = renderHook(
      ({ data }) => useClientPagination({ data, pageSize: 10 }),
      { initialProps: { data: items } }
    )

    act(() => {
      result.current.setPageIndex(2)
    })
    expect(result.current.pageIndex).toBe(2)

    // Filter items down to 5 items (only 1 page)
    items = sampleItems.slice(0, 5)
    rerender({ data: items })

    expect(result.current.pageIndex).toBe(0)
    expect(result.current.paginatedData).toHaveLength(5)
  })
})
