import { createMicroApi, MicroApiError } from "micro-rq"
import { toast } from "@workspace/ui/components/sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!

export const api = createMicroApi({
  name: "kalameh-student",
  baseUrl: API_BASE_URL,
  fetcher: (input, init) => {
    return fetch(input, {
      ...init,
      credentials: "include",
    })
  },
  onError: (error) => {
    if (typeof window === "undefined") return

    // Ignore intentional request aborts/cancellations (e.g. React Query unmount, navigation, StrictMode)
    if (
      (error instanceof DOMException && error.name === "AbortError") ||
      (error as Error)?.name === "AbortError" ||
      (error as Error)?.message?.toLowerCase().includes("abort")
    ) {
      return
    }

    if (error instanceof MicroApiError) {
      const data = error.data as { message?: string | string[] } | undefined
      const message =
        data?.message ||
        (Array.isArray(data?.message) ? data.message.join(" ") : null) ||
        error.statusText ||
        "خطایی در برقراری ارتباط با سرور رخ داد"

      toast.error(
        typeof message === "string" ? message : JSON.stringify(message)
      )

      if (
        error.status === 401 &&
        !window.location.pathname.startsWith("/login")
      ) {
        window.location.href = "/login"
      }
    } else {
      const err = error as Error
      toast.error(err?.message || "خطای غیرمنتظره‌ای رخ داد")
    }
  },
})
