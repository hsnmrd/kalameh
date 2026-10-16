"use client"

import * as React from "react"

export interface UseClientPaginationOptions<T> {
  data: T[] | undefined
  pageSize?: number
  initialPage?: number
  pageIndex?: number
  onPageChange?: (pageIndex: number) => void
}

export interface UseClientPaginationResult<T> {
  pageIndex: number
  setPageIndex: React.Dispatch<React.SetStateAction<number>>
  pageSize: number
  pageCount: number
  totalItems: number
  paginatedData: T[]
}

export function useClientPagination<T>({
  data,
  pageSize = 10,
  initialPage = 0,
  pageIndex: controlledPageIndex,
  onPageChange: controlledOnPageChange,
}: UseClientPaginationOptions<T>): UseClientPaginationResult<T> {
  const [internalPageIndex, setInternalPageIndex] = React.useState(initialPage)
  const isControlled = controlledPageIndex !== undefined

  const totalItems = data?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))

  // Derive clamped pageIndex during render to avoid setting state in an effect
  const rawPageIndex = isControlled ? controlledPageIndex : internalPageIndex
  const pageIndex = Math.min(rawPageIndex, Math.max(0, pageCount - 1))

  const setPageIndex = React.useCallback<
    React.Dispatch<React.SetStateAction<number>>
  >(
    (action) => {
      const nextIndex =
        typeof action === "function" ? action(pageIndex) : action
      if (isControlled) {
        controlledOnPageChange?.(nextIndex)
      } else {
        setInternalPageIndex(nextIndex)
      }
    },
    [isControlled, controlledOnPageChange, pageIndex]
  )

  const paginatedData = React.useMemo(() => {
    if (!data) return []
    const start = pageIndex * pageSize
    return data.slice(start, start + pageSize)
  }, [data, pageIndex, pageSize])

  return {
    pageIndex,
    setPageIndex,
    pageSize,
    pageCount,
    totalItems,
    paginatedData,
  }
}
