# createMicroApi

Use `createMicroApi` to create a small REST client definition surface. It does not replace TanStack Query and does not create React hooks.

```ts
import { createMicroApi } from "micro-rq";

export const api = createMicroApi({
  name: "main",
  baseUrl: "/api",
});
```

## Config

- `name`: Required. Used as the first segment of every query key.
- `baseUrl`: Required. Prepended to endpoint paths.
- `headers`: Optional static headers or async function returning headers.
- `tokenProvider`: Optional provider created by `createTokenProvider`.
- `authHeader`: Optional function that maps an access token to headers, usually `Authorization`.
- `fetcher`: Optional `fetch` replacement for tests or custom runtimes.
- `onError`: Optional observer called with `(error, context)` before the original error is re-thrown.

## Extending clients

Use `extend` when several clients share base config but need different names or small overrides.

```ts
export const publicApi = createMicroApi({
  name: "public",
  baseUrl: "https://example.com",
});

export const api = publicApi.extend({
  name: "private",
});
```

Use distinct `name` values for distinct cache namespaces.

## Do

- Define the API client once per API/cache namespace.
- Keep `baseUrl`, shared headers, auth, and error observation at the API level.
- Use `extend` instead of duplicating large config objects.

## Avoid

- Do not create custom React hooks inside `micro-rq` resources.
- Do not put TanStack Query options such as `staleTime`, `enabled`, `select`, or `onSuccess` in `createMicroApi`.
- Do not invent config properties that are not part of the exported `CreateMicroApiConfig` type.
