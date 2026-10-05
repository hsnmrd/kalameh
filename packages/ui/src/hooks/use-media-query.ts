"use client"

import * as React from "react"

function subscribeToMediaQuery(query: string, onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined

  const mediaQuery = window.matchMedia(query)
  mediaQuery.addEventListener("change", onStoreChange)

  return () => mediaQuery.removeEventListener("change", onStoreChange)
}

function getMediaQuerySnapshot(query: string) {
  return typeof window !== "undefined" && window.matchMedia(query).matches
}

function getServerMediaQuerySnapshot() {
  return false
}

export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => subscribeToMediaQuery(query, onStoreChange),
    [query]
  )
  const getSnapshot = React.useCallback(
    () => getMediaQuerySnapshot(query),
    [query]
  )

  return React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerMediaQuerySnapshot
  )
}
