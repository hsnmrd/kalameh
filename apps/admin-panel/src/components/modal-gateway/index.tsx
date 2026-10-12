"use client"

import * as React from "react"
import { useModal, DEFAULT_MODAL_PARAM_KEY } from "@/lib/hooks/use-modal"
import { ModalSuspenseFallback } from "./modal-suspense-fallback"

export type ModalComponentProps<TData = any> = {
  open: boolean
  onClose: () => void
  data?: TData
  [key: string]: any
}

export type ModalRegistry = Record<
  string,
  React.ComponentType<ModalComponentProps<any>> | React.ComponentType<any>
>

export interface ModalGatewayProps {
  /**
   * Registry mapping each modalKey to its lazy loaded or dynamic component.
   * e.g.:
   * {
   *   createClass: dynamic(() => import("./create-class-modal").then(m => m.CreateClassModal), { ssr: false }),
   *   editClass: React.lazy(() => import("./edit-class-modal")),
   * }
   */
  registry: ModalRegistry

  /** Optional custom URL query param name, defaults to 'modal' */
  paramKey?: string

  /** Fallback element shown while lazy modal is suspending */
  fallback?: React.ReactNode

  /** Optional common props forwarded to all active modal instances */
  extraProps?: Record<string, any>

  /** Optional lifecycle callback triggered right before closing a modal */
  onClose?: (modalKey: string) => void
}

/**
 * ModalGateway renders active modals based on URL query parameter ('modal')
 * and stores passed state in session-persisted Zustand store.
 *
 * If no modals are active, renders an empty fragment (<></>) to keep the DOM tree minimal.
 */
export function ModalGateway({
  registry,
  paramKey = DEFAULT_MODAL_PARAM_KEY,
  fallback,
  extraProps,
  onClose,
}: ModalGatewayProps) {
  const { activeModals, closeModal, getModalData } = useModal(undefined, {
    paramKey,
  })

  // Filter to keys that are actually registered in this gateway instance
  const activeKeys = React.useMemo(
    () => activeModals.filter((key) => Boolean(registry[key])),
    [activeModals, registry]
  )

  if (activeKeys.length === 0) {
    return <></>
  }

  const resolvedFallback = fallback ?? <ModalSuspenseFallback />

  return (
    <>
      {activeKeys.map((modalKey) => {
        const ModalComponent = registry[modalKey]
        if (!ModalComponent) return null

        const data = getModalData(modalKey)

        const handleClose = () => {
          onClose?.(modalKey)
          closeModal(modalKey)
        }

        const isObjectPayload =
          data !== null && typeof data === "object" && !Array.isArray(data)
        const spreadProps = isObjectPayload ? data : {}

        return (
          <React.Suspense key={modalKey} fallback={resolvedFallback}>
            <ModalComponent
              open={true}
              onClose={handleClose}
              data={data}
              {...spreadProps}
              {...extraProps}
            />
          </React.Suspense>
        )
      })}
    </>
  )
}
