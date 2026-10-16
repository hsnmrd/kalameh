"use client"

import { useSyncExternalStore } from "react"

const progressByKey = new Map<string, number>()
const listeners = new Set<() => void>()

export function setUploadProgress(key: string, percent: number) {
  progressByKey.set(key, percent)
  listeners.forEach((listener) => listener())
}

export function resetUploadProgress(key: string) {
  progressByKey.delete(key)
  listeners.forEach((listener) => listener())
}

export function useUploadProgress(key: string): number {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => progressByKey.get(key) ?? 0,
    () => 0
  )
}
