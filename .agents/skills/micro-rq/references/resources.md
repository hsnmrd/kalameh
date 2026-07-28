# Resources

Use `api.resource(resourceName, definition)` to define named REST endpoints once.

```ts
type User = {
  id: string;
  name: string;
};

type CreateUserDto = {
  name: string;
};

export const users = api.resource("users", {
  list: api.get<User[], { page: number }>("/users", {
    query: (params) => params,
  }),
  detail: api.get<User, string>((id) => `/users/${id}`),
  create: api.post<User, CreateUserDto>("/users"),
});
```

GET endpoints become query endpoints. `post`, `put`, `patch`, and `delete` endpoints become mutation endpoints.

## Paths

Use a string path for static endpoints:

```ts
api.get<User[]>("/users");
```

Use a function path when variables are needed:

```ts
api.get<User, string>((id) => `/users/${id}`);
```

## Request mappers

Use mappers when request variables do not directly match path, query, body, headers, or auth mode.

```ts
api.patch<User, { id: string; body: Partial<User>; traceId?: string }>(
  ({ id }) => `/users/${id}`,
  {
    body: ({ body }) => body,
    headers: ({ traceId }) => ({
      "x-trace-id": traceId ?? crypto.randomUUID(),
    }),
  },
);
```

Supported mapper fields:

- `query`: Build query parameters.
- `body`: Build request body.
- `bodyType`: Use `"json"` or `"form-data"`.
- `headers`: Add endpoint-specific headers.
- `authMode`: Use `"optional"`, `"none"`, or `"required"`.

For non-GET methods, variables are sent as the JSON body by default unless a `body` mapper is provided. GET requests never send a body.

## Query keys

Keys follow this shape:

```ts
[apiName, resourceName, endpointName, variables?]
```

Use `baseKey()` to target every query for an endpoint:

```ts
queryClient.invalidateQueries({
  queryKey: users.list.baseKey(),
});
```

Use `key(input)` to target one exact query:

```ts
users.detail.key("user-1");
```

## No-variable endpoints

No-variable endpoints do not require `undefined`.

```ts
const me = api.resource("me", {
  get: api.get<User>("/me"),
});

me.get.toQuery();
me.get.key();
me.get.fn();
```
