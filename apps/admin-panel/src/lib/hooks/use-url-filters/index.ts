"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useRouter, usePathname } from "@/i18n/routing"

export interface UseUrlFiltersOptions<T extends Record<string, unknown>> {
  defaultValues: T
  debounceKeys?: (keyof T)[]
  debounceMs?: number
}

export interface UseUrlFiltersResult<T extends Record<string, unknown>> {
  values: T
  filters: T
  setValue: <K extends keyof T>(key: K, value: T[K]) => void
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void
  setValues: (patch: Partial<T>) => void
  resetValues: () => void
  pageIndex: number
  setPageIndex: (pageIndex: number) => void
  pageSize: number
  setPageSize: (pageSize: number) => void
}

/**
 * Synchronizes list page filters, search text, and pagination with URL query parameters.
 * - Reads initial state from URL query parameters.
 * - Debounces text search URL updates (default: 300ms).
 * - Immediately updates discrete filters and pagination.
 * - Resets page to 1 whenever filters or search change.
 * - Preserves existing non-filter query parameters (e.g. modals).
 * - Cleans defaults from the URL string for clean URLs.
 */
export function useUrlFilters<T extends Record<string, unknown>>({
  defaultValues,
  debounceKeys = ["search", "searchValue"] as (keyof T)[],
  debounceMs = 300,
}: UseUrlFiltersOptions<T>): UseUrlFiltersResult<T> {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Helper to parse values from current searchParams
  const parseFromParams = React.useCallback(
    (params: URLSearchParams | null): T => {
      const parsed = { ...defaultValues }
      if (!params) return parsed

      for (const key of Object.keys(defaultValues) as (keyof T)[]) {
        const paramVal = params.get(String(key))
        if (paramVal !== null) {
          const defaultVal = defaultValues[key]
          if (typeof defaultVal === "number") {
            const num = Number(paramVal)
            parsed[key] = (isNaN(num) ? defaultVal : num) as T[keyof T]
          } else if (typeof defaultVal === "boolean") {
            parsed[key] = (paramVal === "true") as T[keyof T]
          } else {
            parsed[key] = paramVal as T[keyof T]
          }
        }
      }
      return parsed
    },
    [defaultValues]
  )

  const [values, setValuesState] = React.useState<T>(() =>
    parseFromParams(
      searchParams ? new URLSearchParams(searchParams.toString()) : null
    )
  )

  const valuesRef = React.useRef<T>(values)
  React.useEffect(() => {
    valuesRef.current = values
  }, [values])

  const lastUrlStringRef = React.useRef<string>(searchParams?.toString() ?? "")
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Sync state when searchParams changes from outside (e.g. browser Back/Forward)
  React.useEffect(() => {
    const currentQueryStr = searchParams?.toString() ?? ""
    if (currentQueryStr === lastUrlStringRef.current) {
      return
    }
    lastUrlStringRef.current = currentQueryStr
    setValuesState(
      parseFromParams(
        searchParams ? new URLSearchParams(currentQueryStr) : null
      )
    )
  }, [searchParams, parseFromParams])

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // Write new values to URL
  const applyToUrl = React.useCallback(
    (nextVals: T) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "")

      for (const key of Object.keys(defaultValues) as (keyof T)[]) {
        const val = nextVals[key]
        const defaultVal = defaultValues[key]

        // Omit default or empty values from URL
        const isDefault =
          val === defaultVal ||
          val === "" ||
          val === undefined ||
          val === null ||
          (typeof val === "string" && val.toUpperCase() === "ALL")

        if (isDefault) {
          params.delete(String(key))
        } else {
          params.set(String(key), String(val))
        }
      }

      const queryStr = params.toString()
      lastUrlStringRef.current = queryStr
      const targetUrl = queryStr ? `${pathname}?${queryStr}` : pathname
      router.replace(targetUrl, { scroll: false })
    },
    [defaultValues, pathname, router, searchParams]
  )

  const setValue = React.useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      const isDebounced = debounceKeys.includes(key)
      const isPageKey = key === "page" || key === "pageSize"

      const next: T = { ...valuesRef.current, [key]: value }
      if (!isPageKey && "page" in next) {
        ;(next as Record<string, unknown>).page = 1
      }

      setValuesState(next)

      if (isDebounced) {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
        timerRef.current = setTimeout(() => {
          applyToUrl(next)
        }, debounceMs)
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        applyToUrl(next)
      }
    },
    [applyToUrl, debounceKeys, debounceMs]
  )

  const setValues = React.useCallback(
    (patch: Partial<T>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      const next: T = { ...valuesRef.current, ...patch }
      const hasNonPageKeys = Object.keys(patch).some(
        (k) => k !== "page" && k !== "pageSize"
      )
      if (hasNonPageKeys && "page" in next) {
        ;(next as Record<string, unknown>).page = 1
      }
      setValuesState(next)
      applyToUrl(next)
    },
    [applyToUrl]
  )

  const resetValues = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setValuesState(defaultValues)
    applyToUrl(defaultValues)
  }, [applyToUrl, defaultValues])

  const currentPage = Number(values.page) || 1
  const pageIndex = Math.max(0, currentPage - 1)
  const pageSize =
    Number(values.pageSize) || Number(defaultValues.pageSize) || 10

  const setPageIndex = React.useCallback(
    (index: number) => {
      setValue("page" as keyof T, (index + 1) as T[keyof T])
    },
    [setValue]
  )

  const setPageSize = React.useCallback(
    (size: number) => {
      setValues({
        page: 1,
        pageSize: size,
      } as unknown as Partial<T>)
    },
    [setValues]
  )

  return {
    values,
    filters: values,
    setValue,
    setFilter: setValue,
    setValues,
    resetValues,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
  }
}
