"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { usePathname, useRouter } from "@/i18n/routing"
import { useModalStore } from "@/lib/stores/modal"
import { useModalTransition } from "@/components/modal-provider"

export const DEFAULT_MODAL_PARAM_KEY = "modal"

export interface OpenModalOptions {
  /** If true, replaces current history entry instead of pushing a new one */
  replace?: boolean
}

export interface UseModalOptions {
  /** Query parameter name in URL, defaults to 'modal' */
  paramKey?: string
}

export interface UseModalReturn<TData = any> {
  /** List of currently open modal keys in order (derived 100% from query params) */
  activeModals: string[]
  /** Checks if a specific modal key is open */
  isModalOpen: (modalKey: string) => boolean
  /** Opens a modal by key (or multiple keys) and optionally sets payload state */
  openModal: <T = any>(
    modalKey: string | string[],
    data?: T,
    options?: OpenModalOptions
  ) => void
  /** Closes one or multiple modals. If omitted, closes the topmost modal */
  closeModal: (
    modalKeys?: string | string[],
    options?: { replace?: boolean }
  ) => void
  /** Closes all currently open modals */
  closeAllModals: (options?: { replace?: boolean }) => void
  /** Retrieves stored data for a specific modal */
  getModalData: <T = any>(modalKey: string) => T | undefined
  /** Sets stored data for a specific modal */
  setModalData: <T = any>(modalKey: string, data: T) => void
  /** Clears stored data for a specific modal */
  clearModalData: (modalKey: string) => void

  // Scoped helper properties when passing a scoped modalKey:
  isOpen: boolean
  data?: TData
  open: (data?: TData, options?: OpenModalOptions) => void
  close: (options?: { replace?: boolean }) => void

  // Centralized transition loading state:
  isPending: boolean
  pendingModal: string | null
  isModalPending: (modalKey?: string) => boolean
}

/**
 * Parses active modal keys from URL search parameters, handling both
 * comma-delimited strings (?modal=a,b) and repeated query parameters (?modal=a&modal=b).
 */
export function parseModalKeys(
  searchParams:
    | {
        getAll?: (key: string) => string[]
        get?: (key: string) => string | null
      }
    | null
    | undefined,
  paramKey: string = DEFAULT_MODAL_PARAM_KEY
): string[] {
  if (!searchParams) return []
  const allValues =
    typeof searchParams.getAll === "function"
      ? searchParams.getAll(paramKey)
      : searchParams.get?.(paramKey)
        ? [searchParams.get(paramKey)!]
        : []

  if (allValues.length === 0) return []
  const keys: string[] = []
  for (const val of allValues) {
    if (!val) continue
    for (const part of val.split(",")) {
      let trimmed = part.trim()
      try {
        trimmed = decodeURIComponent(trimmed).trim()
      } catch {
        // Keep trimmed as-is if decoding fails
      }
      if (trimmed && !keys.includes(trimmed)) {
        keys.push(trimmed)
      }
    }
  }
  return keys
}

/**
 * Hook for managing URL-driven modals and their associated state.
 *
 * Query parameters are the SINGLE SOURCE OF TRUTH for modal visibility.
 * Modal transitions use React useTransition so URL and UI remain perfectly synchronized.
 *
 * Can be used globally:
 * const { openModal, closeModal, isModalOpen, isPending } = useModal()
 *
 * Or scoped to a specific modal:
 * const { isOpen, data, open, close, isPending } = useModal<MyData>("editUser")
 */
export function useModal<TData = any>(
  scopedKey?: string,
  options?: UseModalOptions
): UseModalReturn<TData> {
  const paramKey = options?.paramKey ?? DEFAULT_MODAL_PARAM_KEY
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const { isPending, pendingModal, startModalTransition } = useModalTransition()

  const modalDataMap = useModalStore((state) => state.modalData)
  const setStoreModalData = useModalStore((state) => state.setModalData)
  const clearStoreModalData = useModalStore((state) => state.clearModalData)

  const activeModals = React.useMemo<string[]>(() => {
    return parseModalKeys(searchParams, paramKey)
  }, [searchParams, paramKey])

  const isModalOpen = React.useCallback(
    (modalKey: string) => activeModals.includes(modalKey),
    [activeModals]
  )

  const openModal = React.useCallback(
    <T = any>(
      modalKey: string | string[],
      data?: T,
      opt?: OpenModalOptions
    ) => {
      if (!modalKey) return

      const rawList = Array.isArray(modalKey) ? modalKey : [modalKey]
      const incomingKeys = rawList.flatMap((k) =>
        k
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
      )
      if (incomingKeys.length === 0) return

      if (data !== undefined) {
        incomingKeys.forEach((key) => {
          setStoreModalData(key, data)
        })
      }

      const currentKeys = parseModalKeys(searchParams, paramKey)

      // Move incoming keys to the top of the stack while preserving previous modals
      const nextKeys = currentKeys.filter((k) => !incomingKeys.includes(k))
      nextKeys.push(...incomingKeys)

      const nextParams = new URLSearchParams(searchParams?.toString() ?? "")
      if (nextKeys.length > 0) {
        nextParams.set(paramKey, nextKeys.join(","))
      } else {
        nextParams.delete(paramKey)
      }

      const queryStr = nextParams.toString()
      const url = queryStr ? `${pathname}?${queryStr}` : pathname

      const topKey = incomingKeys[incomingKeys.length - 1]
      startModalTransition(topKey ?? null, () => {
        if (opt?.replace) {
          router.replace(url, { scroll: false })
        } else {
          router.push(url, { scroll: false })
        }
      })
    },
    [
      pathname,
      router,
      searchParams,
      paramKey,
      setStoreModalData,
      startModalTransition,
    ]
  )

  const closeModal = React.useCallback(
    (modalKeys?: string | string[], opt?: { replace?: boolean }) => {
      const currentKeys = parseModalKeys(searchParams, paramKey)

      let nextKeys: string[]
      if (!modalKeys) {
        // Remove the topmost modal
        const top = currentKeys.pop()
        if (top) {
          clearStoreModalData(top)
        }
        nextKeys = currentKeys
      } else {
        const rawList = Array.isArray(modalKeys) ? modalKeys : [modalKeys]
        const toRemove = rawList.flatMap((k) =>
          k
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
        toRemove.forEach((key) => {
          clearStoreModalData(key)
        })
        nextKeys = currentKeys.filter((k) => !toRemove.includes(k))
      }

      const nextParams = new URLSearchParams(searchParams?.toString() ?? "")
      if (nextKeys.length > 0) {
        nextParams.set(paramKey, nextKeys.join(","))
      } else {
        nextParams.delete(paramKey)
      }

      const queryStr = nextParams.toString()
      const url = queryStr ? `${pathname}?${queryStr}` : pathname

      startModalTransition(null, () => {
        if (opt?.replace) {
          router.replace(url, { scroll: false })
        } else {
          router.push(url, { scroll: false })
        }
      })
    },
    [
      pathname,
      router,
      searchParams,
      paramKey,
      clearStoreModalData,
      startModalTransition,
    ]
  )

  const closeAllModals = React.useCallback(
    (opt?: { replace?: boolean }) => {
      const currentKeys = parseModalKeys(searchParams, paramKey)

      currentKeys.forEach((key) => {
        clearStoreModalData(key)
      })

      const nextParams = new URLSearchParams(searchParams?.toString() ?? "")
      nextParams.delete(paramKey)
      const queryStr = nextParams.toString()
      const url = queryStr ? `${pathname}?${queryStr}` : pathname

      startModalTransition(null, () => {
        if (opt?.replace) {
          router.replace(url, { scroll: false })
        } else {
          router.push(url, { scroll: false })
        }
      })
    },
    [
      pathname,
      router,
      searchParams,
      paramKey,
      clearStoreModalData,
      startModalTransition,
    ]
  )

  const getModalData = React.useCallback(
    <T = any>(modalKey: string): T | undefined => {
      return modalDataMap[modalKey] as T | undefined
    },
    [modalDataMap]
  )

  // Scoped conveniences if scopedKey is provided:
  const isScopedOpen = scopedKey ? isModalOpen(scopedKey) : false
  const scopedData = scopedKey ? (modalDataMap[scopedKey] as TData) : undefined

  const scopedOpen = React.useCallback(
    (data?: TData, opt?: OpenModalOptions) => {
      if (scopedKey) {
        openModal(scopedKey, data, opt)
      }
    },
    [scopedKey, openModal]
  )

  const scopedClose = React.useCallback(
    (opt?: { replace?: boolean }) => {
      if (scopedKey) {
        closeModal(scopedKey, opt)
      }
    },
    [scopedKey, closeModal]
  )

  const isModalPending = React.useCallback(
    (targetKey?: string) => {
      if (targetKey) {
        return Boolean(isPending && pendingModal === targetKey)
      }
      return isPending
    },
    [isPending, pendingModal]
  )

  return {
    activeModals,
    isModalOpen,
    openModal,
    closeModal,
    closeAllModals,
    getModalData,
    setModalData: setStoreModalData,
    clearModalData: clearStoreModalData,
    isOpen: isScopedOpen,
    data: scopedData,
    open: scopedOpen,
    close: scopedClose,
    isPending,
    pendingModal,
    isModalPending,
  }
}
