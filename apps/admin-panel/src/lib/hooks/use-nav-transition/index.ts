"use client"

import * as React from "react"
import { useRouter } from "@/i18n/routing"

export function useNavTransition(pathname: string) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [pendingHref, setPendingHref] = React.useState<string | null>(null)

  // Derived state: pending is only active while transition is ongoing and destination not reached
  const activePendingHref =
    isPending && pathname !== pendingHref ? pendingHref : null

  const navigate = React.useCallback(
    (
      e: React.MouseEvent<HTMLAnchorElement>,
      href: string,
      onAfterClick?: () => void
    ) => {
      onAfterClick?.()

      // Allow default handling for modified clicks, non-primary buttons, or already prevented clicks
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey
      ) {
        return
      }

      e.preventDefault()

      // Avoid redundant transition if already on that exact pathname
      if (pathname === href) {
        return
      }

      setPendingHref(href)
      startTransition(() => {
        router.push(href)
      })
    },
    [pathname, router]
  )

  const isHrefPending = React.useCallback(
    (href: string) => Boolean(activePendingHref && activePendingHref === href),
    [activePendingHref]
  )

  return {
    isPending: Boolean(activePendingHref),
    pendingHref: activePendingHref,
    isHrefPending,
    navigate,
  }
}
