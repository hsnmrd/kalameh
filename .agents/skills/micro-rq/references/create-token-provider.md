# createTokenProvider

Use `createTokenProvider` when requests need access tokens and optional refresh-on-401 behavior.

```ts
import { createMicroApi, createTokenProvider } from "micro-rq";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const authApi = createMicroApi({
  name: "auth",
  baseUrl: "/api",
});

const auth = authApi.resource("auth", {
  refresh: authApi.post<AuthTokens, { refreshToken?: string | null }>("/refresh", {
    authMode: "none",
  }),
});

export const tokenProvider = createTokenProvider({
  getAccessToken: () => localStorage.getItem("accessToken"),
  getRefreshToken: () => localStorage.getItem("refreshToken"),
  refresh: {
    fn: ({ refreshToken }) => auth.refresh.fn({ refreshToken }),
    selectAccessToken: (tokens) => tokens.accessToken,
    onSuccess: (tokens) => {
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
    },
    onError: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
});

export const api = createMicroApi({
  name: "main",
  baseUrl: "/api",
  tokenProvider,
  authHeader: (token) => ({
    Authorization: `Bearer ${token}`,
  }),
});
```

## Refresh behavior

When a request returns `401` and refresh is configured, `micro-rq` refreshes once and retries the original request once. Parallel `401` responses share the same refresh promise.

Use `selectAccessToken` so the refreshed access token is used immediately for retried requests.

## Auth modes

- `optional`: Default. Use a token when one exists.
- `none`: Skip token lookup, auth header injection, and refresh-on-401.
- `required`: Require an access token before calling `fetch`; throws `MicroAuthRequiredError` if missing.

Use `authMode: "none"` for login, refresh, public, or anonymous endpoints.

Use `authMode: "required"` for endpoints that must never call the server without a token.
