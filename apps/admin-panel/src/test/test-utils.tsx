import * as React from "react"
import { render, RenderOptions } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import authMessagesFa from "../messages/fa/auth.json"
import usersMessagesFa from "../messages/fa/users.json"
import studentsMessagesFa from "../messages/fa/students.json"
import commonMessagesFa from "../messages/fa/common.json"
import termsMessagesFa from "../messages/fa/terms.json"
import coursesMessagesFa from "../messages/fa/courses.json"
import classesMessagesFa from "../messages/fa/classes.json"
import gradesMessagesFa from "../messages/fa/grades.json"
import institutesMessagesFa from "../messages/fa/institutes.json"
import rolePermissionsMessagesFa from "../messages/fa/role-permissions.json"
import { ROLES, type AuthUser } from "@workspace/types"
import { authResource } from "../lib/api"
import branchesMessagesFa from "../messages/fa/branches.json"

const defaultMessages = {
  auth: authMessagesFa,
  users: usersMessagesFa,
  students: studentsMessagesFa,
  common: commonMessagesFa,
  terms: termsMessagesFa,
  branches: branchesMessagesFa,
  courses: coursesMessagesFa,
  classes: classesMessagesFa,
  grades: gradesMessagesFa,
  institutes: institutesMessagesFa,
  rolePermissions: rolePermissionsMessagesFa,
}

export const defaultTestUser: AuthUser = {
  id: "00000000-0000-0000-0000-000000000000",
  instituteId: "11111111-1111-1111-1111-111111111111",
  role: ROLES.SUPER_ADMIN,
  firstName: "Super",
  lastName: "Admin",
  phone: "09120000000",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

interface AllTheProvidersProps {
  children: React.ReactNode
  locale?: string
  messages?: Record<string, unknown>
}

export function createTestQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
  client.setQueryData(authResource.me.toQuery().queryKey, defaultTestUser)
  return client
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
