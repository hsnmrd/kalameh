# TanStack Query Integration

`micro-rq` returns plain TanStack Query config pieces. Keep using TanStack Query directly.

## Queries

```tsx
const usersQuery = useQuery({
  ...users.list.toQuery({ page: 1 }),
  staleTime: 60_000,
});
```

`toQuery()` returns only:

```ts
{
  queryKey,
  queryFn,
}
```

Add TanStack Query options at the call site:

```tsx
const userQuery = useQuery({
  ...users.detail.toQuery(userId),
  enabled: Boolean(userId),
});
```

## Mutations

```tsx
const createUser = useMutation({
  ...users.create.toMutation(),
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: users.list.baseKey(),
    });
  },
});

createUser.mutate({
  name: "John",
});
```

`toMutation()` returns only:

```ts
{
  mutationFn,
}
```

Pass mutation variables to `mutate()` or `mutateAsync()`, not to `toMutation()`.

## Direct calls

Use `fn` for tests, server prefetching helpers, or direct imperative calls.

```ts
const runDetail = users.detail.fn("user-1");
const user = await runDetail();

const created = await users.create.fn({ name: "John" });
```

Query endpoint `fn` returns a zero-argument query function. Mutation endpoint `fn` executes immediately.

## Next.js hydration

Use generated query configs with TanStack Query prefetching.

```tsx
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export default async function UsersPage() {
  const queryClient = new QueryClient();
  const params = { page: 1 };

  await queryClient.prefetchQuery(users.list.toQuery(params));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersClient params={params} />
    </HydrationBoundary>
  );
}
```

Client components still call `useQuery` with the same generated config.
