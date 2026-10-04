import * as React from "react"
import { render, RenderOptions } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import authMessagesFa from "../messages/fa/auth.json"
import commonMessagesFa from "../messages/fa/common.json"
import classesMessagesFa from "../messages/fa/classes.json"

const defaultMessages = {
  auth: authMessagesFa,
  common: commonMessagesFa,
  classes: classesMessagesFa,
}

interface AllTheProvidersProps {
  children: React.ReactNode
  locale?: string
  messages?: Record<string, unknown>
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function AllTheProviders({
  children,
  locale = "fa",
  messages = defaultMessages,
}: AllTheProvidersProps) {
  const queryClient = React.useMemo(() => createTestQueryClient(), [])

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & {
    locale?: string
    messages?: Record<string, unknown>
  }
): ReturnType<typeof render> => {
  const { locale, messages, ...rest } = options || {}
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders locale={locale} messages={messages}>
        {children}
      </AllTheProviders>
    ),
    ...rest,
  })
}

export * from "@testing-library/react"
export { customRender as render }
