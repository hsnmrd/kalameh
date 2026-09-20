"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@workspace/ui/components/theme-provider"

import { MicroApiError } from "micro-rq"
import { DirectionProvider } from "@workspace/ui/components/direction-provider"

export function Providers({
  children,
  direction = "rtl",
}: {
  children: React.ReactNode
  direction?: "rtl" | "ltr"
}) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              return false
              // Never retry client errors (401, 403, 404)
              if (
                error instanceof MicroApiError &&
                (error.status === 401 ||
                  error.status === 403 ||
                  error.status === 404)
              ) {
                return false
              }
              // Only retry once for transient server (5xx) or network errors
              return failureCount < 1
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ThemeProvider>
      <DirectionProvider direction={direction}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </DirectionProvider>
    </ThemeProvider>
  )
}
