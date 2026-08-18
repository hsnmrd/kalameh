import { createMicroApi, createTokenProvider } from "micro-rq"
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  ChangePasswordInput,
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
  name: "kalameh-student",
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
