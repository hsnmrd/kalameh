"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "@workspace/ui/components/sonner"
import { usePwaContext } from "@/components/pwa-provider"

export function PwaNotifier() {
  const t = useTranslations("common")
  const { isOffline, isUpdateAvailable, updateApp } = usePwaContext()

  const prevOfflineRef = React.useRef(isOffline)
  const hasNotifiedUpdateRef = React.useRef(false)

  // Notify on offline / online status change
  React.useEffect(() => {
    if (prevOfflineRef.current !== isOffline) {
      if (isOffline) {
        toast.warning(t("pwa.offlineTitle"), {
          description: t("pwa.offlineDescription"),
          duration: 5000,
        })
      } else {
        toast.success(t("pwa.onlineBack"), {
          duration: 3000,
        })
      }
      prevOfflineRef.current = isOffline
    }
  }, [isOffline, t])

  // Notify when a new Service Worker update is waiting
  React.useEffect(() => {
    if (isUpdateAvailable && !hasNotifiedUpdateRef.current) {
      hasNotifiedUpdateRef.current = true
      toast.info(t("pwa.updateAvailable"), {
        description: t("pwa.updateDescription"),
        duration: Infinity,
        action: {
          label: t("pwa.updateButton"),
          onClick: () => updateApp(),
        },
      })
    }
  }, [isUpdateAvailable, updateApp, t])

  return null
}
