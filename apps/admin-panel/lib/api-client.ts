import { createMicroApi, createTokenProvider } from "micro-rq"
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  ChangePasswordInput,
  CreateUserInput,
  UpdateUserInput,
} from "@workspace/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export const tokenProvider = createTokenProvider({
  getAccessToken: () => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("accessToken")
  },
  getRefreshToken: () => null,
})

export const api = createMicroApi({
  name: "kalameh-admin",
  baseUrl: API_BASE_URL,
  tokenProvider,
  authHeader: (token) => ({
    Authorization: `Bearer ${token}`,
  }),
})

export const authResource = api.resource("auth", {
  login: api.post<AuthResponse, LoginInput>("/auth/login", {
    authMode: "none",
  }),
  me: api.get<AuthUser>("/auth/me", {
    authMode: "required",
  }),
  changePassword: api.post<{ message: string }, ChangePasswordInput>(
    "/auth/change-password",
    {
      authMode: "required",
    }
  ),
})

export const usersResource = api.resource("users", {
  list: api.get<AuthUser[], { role?: string; search?: string } | undefined>(
    "/users",
    {
      authMode: "required",
      query: (params) => params || {},
    }
  ),
  detail: api.get<AuthUser, string>((id) => `/users/${id}`, {
    authMode: "required",
  }),
  create: api.post<AuthUser, CreateUserInput>("/users", {
    authMode: "required",
  }),
  update: api.patch<AuthUser, { id: string; body: UpdateUserInput }>(
    ({ id }) => `/users/${id}`,
    {
      authMode: "required",
      body: ({ body }) => body,
    }
  ),
  resetPassword: api.post<
    { message: string },
    { id: string; newPassword?: string }
  >(({ id }) => `/users/${id}/reset-password`, {
    authMode: "required",
    body: ({ newPassword }) => ({ newPassword }),
  }),
})
