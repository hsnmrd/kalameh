# Errors

Failed HTTP responses throw `MicroApiError`.

```ts
import { MicroApiError } from "micro-rq";

try {
  await users.detail.fn("user-1")();
} catch (error) {
  if (error instanceof MicroApiError) {
    console.log(error.status);
    console.log(error.statusText);
    console.log(error.data);
    console.log(error.response);
  }
}
```

Missing required auth throws `MicroAuthRequiredError` before calling `fetch`.

```ts
import { MicroAuthRequiredError } from "micro-rq";

try {
  await privateResource.me.fn()();
} catch (error) {
  if (error instanceof MicroAuthRequiredError) {
    // Prompt for login.
  }
}
```

## API-level error observation

Use `onError` to observe errors at the API client level.

```ts
const api = createMicroApi({
  name: "main",
  baseUrl: "/api",
  onError: (error, context) => {
    console.log(context.method, context.url, error);
  },
});
```

The original error is still thrown so TanStack Query retries, error states, callbacks, and error boundaries continue to work normally.
