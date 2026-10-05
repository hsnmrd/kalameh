"use client"

import { useMediaQuery } from "./use-media-query"

const MOBILE_MEDIA_QUERY = "(max-width: 1023px)"

export { useMediaQuery }

export function useIsMobile() {
  return useMediaQuery(MOBILE_MEDIA_QUERY)
}
