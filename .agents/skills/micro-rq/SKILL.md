---
name: micro-rq
description: Use when working in a project that uses micro-rq to define REST resources, configure API clients, handle auth/token refresh, or pass generated query and mutation configs to TanStack Query.
---

# micro-rq

Use the local reference files in this skill as the source of truth for the installed micro-rq package version.

Before changing micro-rq API client, resource, auth, token refresh, query, mutation, or invalidation code, read the relevant reference file:

- [Overview and doc map](references/index.md)
- [API client creation](references/create-micro-api.md)
- [Token provider and auth refresh](references/create-token-provider.md)
- [Resource definitions and endpoint builders](references/resources.md)
- [TanStack Query usage](references/tanstack-query.md)
- [Error handling](references/errors.md)

Use micro-rq to define REST resources once and pass generated query and mutation configs directly to TanStack Query. Do not wrap TanStack Query, generate hooks, or invent APIs that are not documented in these references.
