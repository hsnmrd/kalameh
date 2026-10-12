"use client"

import * as React from "react"
import { ModalLoadingBar } from "./modal-loading-bar"

export interface ModalTransitionContextValue {
  isPending: boolean
  pendingModal: string | null
  startModalTransition: (modalKey: string | null, callback: () => void) => void
}

export const ModalTransitionContext =
  React.createContext<ModalTransitionContextValue | null>(null)

export interface ModalProviderProps {
  children: React.ReactNode
  showLoadingBar?: boolean
}

export function ModalProvider({
  children,
  showLoadingBar = true,
}: ModalProviderProps) {
  const [isPending, startTransition] = React.useTransition()
  const [rawPendingModal, setRawPendingModal] = React.useState<string | null>(
    null
  )

  // Derived state: pendingModal is only non-null while transition is active
  const pendingModal = isPending ? rawPendingModal : null

  const startModalTransition = React.useCallback(
    (modalKey: string | null, callback: () => void) => {
      setRawPendingModal(modalKey)
      startTransition(() => {
        callback()
      })
    },
    [startTransition]
  )

  const value = React.useMemo<ModalTransitionContextValue>(
    () => ({
      isPending,
      pendingModal,
      startModalTransition,
    }),
    [isPending, pendingModal, startModalTransition]
  )

  return (
    <ModalTransitionContext.Provider value={value}>
      {showLoadingBar && <ModalLoadingBar isPending={isPending} />}
      {children}
    </ModalTransitionContext.Provider>
  )
}

/**
 * Hook to access the modal transition state.
 * If used within ModalProvider, shares the global transition state.
 * If used outside ModalProvider, gracefully falls back to a local useTransition.
 */
export function useModalTransition(): ModalTransitionContextValue {
  const context = React.useContext(ModalTransitionContext)
  const [localPending, localStartTransition] = React.useTransition()
  const [localRawPendingModal, setLocalRawPendingModal] = React.useState<
    string | null
  >(null)

  const fallbackPendingModal = localPending ? localRawPendingModal : null

  const fallbackStartModalTransition = React.useCallback(
    (modalKey: string | null, callback: () => void) => {
      setLocalRawPendingModal(modalKey)
      localStartTransition(() => {
        callback()
      })
    },
    [localStartTransition]
  )

  if (context) {
    return context
  }

  return {
    isPending: localPending,
    pendingModal: fallbackPendingModal,
    startModalTransition: fallbackStartModalTransition,
  }
}
