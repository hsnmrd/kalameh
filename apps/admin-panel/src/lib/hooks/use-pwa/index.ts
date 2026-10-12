"use client"

import * as React from "react"

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export interface UsePwaReturn {
  isSupported: boolean
  isInstalled: boolean
  isInstallable: boolean
  isOffline: boolean
  isUpdateAvailable: boolean
  installApp: () => Promise<boolean>
  updateApp: () => void
}

export function usePwa(): UsePwaReturn {
  const isSupported = React.useMemo(() => {
    return typeof navigator !== "undefined" && "serviceWorker" in navigator
  }, [])

  const [isInstalled, setIsInstalled] = React.useState(() => {
    if (typeof window === "undefined") return false
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    )
  })

  const [isOffline, setIsOffline] = React.useState(() => {
    if (typeof navigator !== "undefined") {
      return !navigator.onLine
    }
    return false
  })

  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null)
  const [waitingWorker, setWaitingWorker] =
    React.useState<ServiceWorker | null>(null)

  // Online / Offline listeners
  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Install prompt listeners
  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  // Service Worker registration & updates
  React.useEffect(() => {
    if (typeof window === "undefined" || !isSupported) return

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing
          if (installing) {
            installing.addEventListener("statechange", () => {
              if (
                installing.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setWaitingWorker(installing)
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error("SW registration error:", error)
      })

    let isRefreshing = false
    const handleControllerChange = () => {
      if (!isRefreshing) {
        isRefreshing = true
        window.location.reload()
      }
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    )

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      )
    }
  }, [isSupported])

  const installApp = React.useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setDeferredPrompt(null)
        setIsInstalled(true)
        return true
      }
      setDeferredPrompt(null)
      return false
    } catch {
      setDeferredPrompt(null)
      return false
    }
  }, [deferredPrompt])

  const updateApp = React.useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" })
    }
  }, [waitingWorker])

  return {
    isSupported,
    isInstalled,
    isInstallable: Boolean(deferredPrompt) && !isInstalled,
    isOffline,
    isUpdateAvailable: Boolean(waitingWorker),
    installApp,
    updateApp,
  }
}
