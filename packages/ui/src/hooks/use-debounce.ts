"use client"

import * as React from "react"

/**
 * Debounces a value by the specified delay.
 *
 * @param value - The value to debounce.
 * @param delay - Debounce delay in milliseconds (default: 400ms).
 * @returns The debounced value, which updates only after the caller
 *          stops changing `value` for at least `delay` ms.
 *
 * @example
 * ```tsx
 * const [search, setSearch] = React.useState("")
 * const debouncedSearch = useDebounce(search, 300)
 *
 * // debouncedSearch updates 300ms after the user stops typing
 * ```
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
