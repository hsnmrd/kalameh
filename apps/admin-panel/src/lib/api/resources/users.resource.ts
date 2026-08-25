import type {
  AuthUser,
  CreateUserInput,
  UpdateUserInput,
  ExcelImportResult,
} from "@workspace/types"
import { api } from "../client"

export const usersResource = api.resource("users", {
  list: api.get<
    AuthUser[],
    { role?: string; search?: string; instituteId?: string } | undefined
  >("/users", {
    query: (params) => params || {},
  }),
  detail: api.get<AuthUser, string>((id) => `/users/${id}`),
  create: api.post<AuthUser, CreateUserInput>("/users"),
  update: api.patch<AuthUser, { id: string; body: UpdateUserInput }>(
    ({ id }) => `/users/${id}`,
    {
      body: ({ body }) => body,
    }
  ),
  resetPassword: api.post<
    { message: string },
    { id: string; newPassword?: string }
  >(({ id }) => `/users/${id}/reset-password`, {
    body: ({ newPassword }) => ({ newPassword }),
  }),
  importExcel: api.post<ExcelImportResult, FormData>("/users/import-excel", {
    body: (formData) => formData,
  }),
})
