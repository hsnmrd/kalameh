"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@workspace/ui/components/theme-provider"

import { MicroApiError } from "micro-rq"
import { DirectionProvider } from "@workspace/ui/components/direction-provider"
import { ModalProvider } from "@/components/modal-provider"
import { PwaProvider } from "@/components/pwa-provider"

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
          // Never retry client errors (4xx)
          const errorStatus = (error as unknown as { status?: unknown })?.status
          const status =
            error instanceof MicroApiError
              ? error.status
              : typeof errorStatus === "number"
                ? errorStatus
                : undefined
          if (typeof status === "number" && status >= 400 && status < 500) {
            return false
          }
          // Only retry once for transient server (5xx) or network errors
          return failureCount < 1
        },
        refetchOnWindowFocus: false,
      },
    },
  })
}

export function Providers({
  children,
  direction = "rtl",
}: {
  children: React.ReactNode
  direction?: "rtl" | "ltr"
}) {
  const [queryClient] = React.useState(() => createQueryClient())

  return (
    <ThemeProvider>
      <DirectionProvider direction={direction}>
        <QueryClientProvider client={queryClient}>
          <PwaProvider>
            <ModalProvider>
              {children}
              <Toaster />
            </ModalProvider>
          </PwaProvider>
        </QueryClientProvider>
      </DirectionProvider>
    </ThemeProvider>
  )
}
