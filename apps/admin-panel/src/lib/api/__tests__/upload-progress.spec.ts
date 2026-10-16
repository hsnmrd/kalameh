import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import {
  setUploadProgress,
  resetUploadProgress,
  useUploadProgress,
} from "../upload-progress"

describe("upload-progress", () => {
  it("should initialize with 0 for an unknown key", () => {
    const { result } = renderHook(() => useUploadProgress("unknown-key"))
    expect(result.current).toBe(0)
  })

  it("should update progress reactively when setUploadProgress is called", () => {
    const { result } = renderHook(() => useUploadProgress("test-key"))
    expect(result.current).toBe(0)

    act(() => {
      setUploadProgress("test-key", 45)
    })
    expect(result.current).toBe(45)

    act(() => {
      setUploadProgress("test-key", 100)
    })
    expect(result.current).toBe(100)
  })

  it("should reset progress to 0 when resetUploadProgress is called", () => {
    const { result } = renderHook(() => useUploadProgress("reset-key"))

    act(() => {
      setUploadProgress("reset-key", 75)
    })
    expect(result.current).toBe(75)

    act(() => {
      resetUploadProgress("reset-key")
    })
    expect(result.current).toBe(0)
  })

  it("should isolate progress across different keys", () => {
    const { result: key1 } = renderHook(() => useUploadProgress("key-1"))
    const { result: key2 } = renderHook(() => useUploadProgress("key-2"))

    act(() => {
      setUploadProgress("key-1", 30)
      setUploadProgress("key-2", 80)
    })

    expect(key1.current).toBe(30)
    expect(key2.current).toBe(80)

    act(() => {
      resetUploadProgress("key-1")
    })

    expect(key1.current).toBe(0)
    expect(key2.current).toBe(80)
  })
})
