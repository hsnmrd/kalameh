"use client"

import * as React from "react"

export interface UseMobileScrollRevealOptions {
  /** Keep revealed if there is an active search query or filter active */
  pinned?: boolean
  /** Scroll position (px) considered "top" of the page. Default: 20 */
  topThreshold?: number
  /** Distance (px) of downward swipe to trigger reveal. Default: 10 */
  swipeThreshold?: number
}

export interface UseMobileScrollRevealResult {
  /** Whether the filter/search bar is currently revealed on mobile */
  isRevealed: boolean
  /** Set reveal state manually */
  setIsRevealed: React.Dispatch<React.SetStateAction<boolean>>
  /** Toggle reveal state */
  toggleRevealed: () => void
}

export function useMobileScrollReveal(
  options: UseMobileScrollRevealOptions = {}
): UseMobileScrollRevealResult {
  const { pinned = false, topThreshold = 20, swipeThreshold = 10 } = options

  const [internalRevealed, setInternalRevealed] = React.useState(false)
  const touchStartYRef = React.useRef<number | null>(null)
  const lastScrollYRef = React.useRef(0)

  const toggleRevealed = React.useCallback(() => {
    setInternalRevealed((prev) => !prev)
  }, [])

  const setIsRevealed: React.Dispatch<React.SetStateAction<boolean>> =
    React.useCallback((value) => {
      setInternalRevealed(value)
    }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0]?.clientY ?? null
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current === null) return
      const currentY = e.touches[0]?.clientY ?? 0
      const deltaY = currentY - touchStartYRef.current
      const currentScrollY =
        window.scrollY || document.documentElement.scrollTop

      if (currentScrollY <= topThreshold && deltaY > swipeThreshold) {
        // Downward swipe / pull down at top reveals
        setInternalRevealed(true)
      }
    }

    const handleTouchEnd = () => {
      touchStartYRef.current = null
    }

    const handleWheel = (e: WheelEvent) => {
      const currentScrollY =
        window.scrollY || document.documentElement.scrollTop

      if (
        currentScrollY <= topThreshold &&
        (e.deltaY < 0 || (currentScrollY === 0 && e.deltaY > 0))
      ) {
        // Downward pull at top reveals
        setInternalRevealed(true)
      }
    }

    const handleScroll = () => {
      const currentScrollY =
        window.scrollY || document.documentElement.scrollTop

      if (lastScrollYRef.current <= topThreshold && currentScrollY > 0) {
        // Any scroll down from top reveals it
        setInternalRevealed(true)
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd, { passive: true })
    window.addEventListener("wheel", handleWheel, { passive: true })
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [topThreshold, swipeThreshold])

  return {
    isRevealed: pinned || internalRevealed,
    setIsRevealed,
    toggleRevealed,
  }
}
