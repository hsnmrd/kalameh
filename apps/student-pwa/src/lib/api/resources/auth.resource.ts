import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  ChangePasswordInput,
} from "@workspace/types"
import { api } from "../client"

export const authResource = api.resource("auth", {
  login: api.post<AuthResponse, LoginInput>("/auth/login"),
  logout: api.post<{ message: string }, void>("/auth/logout"),
  me: api.get<AuthUser>("/auth/me"),
  changePassword: api.post<{ message: string }, ChangePasswordInput>(
    "/auth/change-password"
  ),
})
