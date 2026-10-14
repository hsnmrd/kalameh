"use client"

import * as React from "react"

export interface UseClientPaginationOptions<T> {
  data: T[] | undefined
  pageSize?: number
  initialPage?: number
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
}: UseClientPaginationOptions<T>): UseClientPaginationResult<T> {
  const [pageIndexState, setPageIndex] = React.useState(initialPage)

  const totalItems = data?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))

  // Derive clamped pageIndex during render to avoid setting state in an effect
  const pageIndex = Math.min(pageIndexState, Math.max(0, pageCount - 1))

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
