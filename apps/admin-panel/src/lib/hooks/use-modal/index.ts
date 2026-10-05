"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { usePathname, useRouter } from "@/i18n/routing"
import { useModalStore } from "@/lib/stores/modal"

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
  /** List of currently open modal keys in order */
  activeModals: string[]
  /** Checks if a specific modal key is open */
  isModalOpen: (modalKey: string) => boolean
  /** Opens a modal by key and optionally sets payload state */
  openModal: <T = any>(
    modalKey: string,
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
}

/**
 * Hook for managing URL-driven modals and their associated state.
 *
 * Can be used globally:
 * const { openModal, closeModal, isModalOpen } = useModal()
 *
 * Or scoped to a specific modal:
 * const { isOpen, data, open, close } = useModal<MyData>("editUser")
 */
export function useModal<TData = any>(
  scopedKey?: string,
  options?: UseModalOptions
): UseModalReturn<TData> {
  const paramKey = options?.paramKey ?? DEFAULT_MODAL_PARAM_KEY
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const rawModalParam = searchParams?.get(paramKey) ?? null
  const storeActiveModals = useModalStore((state) => state.activeModals)
  const setActiveModalsInStore = useModalStore((state) => state.setActiveModals)
  const openModalInStore = useModalStore((state) => state.openModalInStore)
  const closeModalInStore = useModalStore((state) => state.closeModalInStore)
  const modalDataMap = useModalStore((state) => state.modalData)
  const setStoreModalData = useModalStore((state) => state.setModalData)
  const clearStoreModalData = useModalStore((state) => state.clearModalData)

  const prevRawModalParamRef = React.useRef(rawModalParam)

  const urlModals = React.useMemo<string[]>(() => {
    if (!rawModalParam) return []
    return rawModalParam
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
  }, [rawModalParam])

  // Sync from initial URL on mount if URL contains modals
  React.useEffect(() => {
    if (urlModals.length > 0 && storeActiveModals.length === 0) {
      setActiveModalsInStore(urlModals)
    }
  }, [urlModals, storeActiveModals.length, setActiveModalsInStore])

  // Sync from URL changes (such as Back / Forward navigation)
  React.useEffect(() => {
    if (prevRawModalParamRef.current !== rawModalParam) {
      prevRawModalParamRef.current = rawModalParam
      setActiveModalsInStore(urlModals)
    }
  }, [rawModalParam, urlModals, setActiveModalsInStore])

  const activeModals = React.useMemo<string[]>(() => {
    if (storeActiveModals.length > 0) return storeActiveModals
    if (rawModalParam) return urlModals
    return []
  }, [storeActiveModals, rawModalParam, urlModals])

  const isModalOpen = React.useCallback(
    (modalKey: string) => activeModals.includes(modalKey),
    [activeModals]
  )

  const openModal = React.useCallback(
    <T = any>(modalKey: string, data?: T, opt?: OpenModalOptions) => {
      if (!modalKey) return

      if (data !== undefined) {
        setStoreModalData(modalKey, data)
      }

      openModalInStore(modalKey)

      const currentKeys = rawModalParam
        ? rawModalParam
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : []

      if (!currentKeys.includes(modalKey)) {
        currentKeys.push(modalKey)
      }

      const nextParams = new URLSearchParams(searchParams?.toString() ?? "")
      const nextParamValue = currentKeys.join(",")
      nextParams.set(paramKey, nextParamValue)
      prevRawModalParamRef.current = nextParamValue

      const url = `${pathname}?${nextParams.toString()}`

      if (opt?.replace) {
        router.replace(url, { scroll: false })
      } else {
        router.push(url, { scroll: false })
      }
    },
    [
      pathname,
      router,
      searchParams,
      rawModalParam,
      paramKey,
      setStoreModalData,
      openModalInStore,
    ]
  )

  const closeModal = React.useCallback(
    (modalKeys?: string | string[], opt?: { replace?: boolean }) => {
      closeModalInStore(modalKeys)

      const currentKeys = rawModalParam
        ? rawModalParam
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : []

      let nextKeys: string[]
      if (!modalKeys) {
        // Remove the topmost modal
        const top = currentKeys.pop()
        if (top) {
          clearStoreModalData(top)
        }
        nextKeys = currentKeys
      } else {
        const toRemove = Array.isArray(modalKeys) ? modalKeys : [modalKeys]
        toRemove.forEach((key) => {
          clearStoreModalData(key)
        })
        nextKeys = currentKeys.filter((k) => !toRemove.includes(k))
      }

      const nextParams = new URLSearchParams(searchParams?.toString() ?? "")
      if (nextKeys.length > 0) {
        const nextParamValue = nextKeys.join(",")
        nextParams.set(paramKey, nextParamValue)
        prevRawModalParamRef.current = nextParamValue
      } else {
        nextParams.delete(paramKey)
        prevRawModalParamRef.current = null
      }

      const queryStr = nextParams.toString()
      const url = queryStr ? `${pathname}?${queryStr}` : pathname

      if (opt?.replace) {
        router.replace(url, { scroll: false })
      } else {
        router.push(url, { scroll: false })
      }
    },
    [
      pathname,
      router,
      searchParams,
      rawModalParam,
      paramKey,
      clearStoreModalData,
      closeModalInStore,
    ]
  )

  const closeAllModals = React.useCallback(
    (opt?: { replace?: boolean }) => {
      const currentKeys = rawModalParam
        ? rawModalParam
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : []

      currentKeys.forEach((key) => {
        clearStoreModalData(key)
      })

      const nextParams = new URLSearchParams(searchParams?.toString() ?? "")
      nextParams.delete(paramKey)
      const queryStr = nextParams.toString()
      const url = queryStr ? `${pathname}?${queryStr}` : pathname

      if (opt?.replace) {
        router.replace(url, { scroll: false })
      } else {
        router.push(url, { scroll: false })
      }
    },
    [
      pathname,
      router,
      searchParams,
      rawModalParam,
      paramKey,
      clearStoreModalData,
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
  }
}
