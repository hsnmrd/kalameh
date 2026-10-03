import { createMicroApi, MicroApiError } from "micro-rq"
import { toast } from "@workspace/ui/components/sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api-proxy"

export const api = createMicroApi({
  name: "kalameh-student",
  baseUrl: API_BASE_URL,
  fetcher: (input, init) => {
    const locale =
      typeof document !== "undefined"
        ? document.documentElement.lang || "fa"
        : "fa"

    const headers = new Headers(init?.headers)
    if (!headers.has("Accept-Language")) {
      headers.set("Accept-Language", locale)
    }

    let url = input
    if (
      typeof window !== "undefined" &&
      typeof url === "string" &&
      url.startsWith("http") &&
      window.location.hostname &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      url = url.replace(
        /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/,
        `$1${window.location.hostname}$3`
      )
    }

    return fetch(url, {
      ...init,
      headers,
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
      const data = error.data as
        | {
            message?: string | string[]
            errors?: Array<{
              path?: (string | number)[]
              message?: string
              code?: string
            }>
          }
        | undefined

      const title =
        (typeof data?.message === "string" ? data.message : null) ||
        error.statusText ||
        "خطایی در برقراری ارتباط با سرور رخ داد"

      let description: string | undefined

      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        const errorDetails = data.errors
          .map((err) => {
            if (typeof err === "string") return err
            const field =
              Array.isArray(err?.path) && err.path.length > 0
                ? err.path.join(".")
                : ""
            const errMsg = err?.message || ""
            return field && errMsg ? `${field}: ${errMsg}` : errMsg || field
          })
          .filter(Boolean)

        if (errorDetails.length > 0) {
          description = errorDetails.join("\n")
        }
      } else if (Array.isArray(data?.message) && data.message.length > 0) {
        description = data.message.join("\n")
      }

      toast.error(title, description ? { description } : undefined)

      const isLoginPage = window.location.pathname.includes("/login")
      if (error.status === 401 && !isLoginPage) {
        const locale = window.location.pathname.match(/^\/(en|fa)/)?.[1] || "fa"
        window.location.href = `/${locale}/login`
      }
    } else {
      const err = error as Error
      toast.error(err?.message || "خطای غیرمنتظره‌ای رخ داد")
    }
  },
})
