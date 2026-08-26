"use client"

import * as React from "react"

const MOBILE_MEDIA_QUERY = "(max-width: 1023px)"

function subscribeToMobileQuery(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined

  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
  mediaQuery.addEventListener("change", onStoreChange)

  return () => mediaQuery.removeEventListener("change", onStoreChange)
}

function getMobileSnapshot() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(MOBILE_MEDIA_QUERY).matches
  )
}

function getServerMobileSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileQuery,
    getMobileSnapshot,
    getServerMobileSnapshot
  )
}
