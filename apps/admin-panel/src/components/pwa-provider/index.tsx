"use client"

import * as React from "react"
import { usePwa, type UsePwaReturn } from "@/lib/hooks"

const defaultPwaValue: UsePwaReturn = {
  isSupported: false,
  isInstalled: false,
  isInstallable: false,
  isOffline: false,
  isUpdateAvailable: false,
  installApp: async () => false,
  updateApp: () => {},
}

const PwaContext = React.createContext<UsePwaReturn>(defaultPwaValue)

export function usePwaContext(): UsePwaReturn {
  return React.useContext(PwaContext)
}

export interface PwaProviderProps {
  children: React.ReactNode
}

export function PwaProvider({ children }: PwaProviderProps) {
  const pwa = usePwa()
  return <PwaContext.Provider value={pwa}>{children}</PwaContext.Provider>
}
