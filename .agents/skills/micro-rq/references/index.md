# micro-rq AI Agent Docs

These docs are bundled with the installed `micro-rq` package so coding agents can use documentation that matches the project dependency version.

When working on a project that uses `micro-rq`, read the relevant file in this directory before changing API client, resource, auth, token refresh, query, mutation, or invalidation code.

## Local skill install

Ask users to run this command from the project root:

```sh
npx micro-rq agents init
```

That command creates or updates a project-local micro-rq skill:

```text
.agents/
  micro-rq/
    SKILL.md
    references/
      index.md
      create-micro-api.md
      create-token-provider.md
      resources.md
      tanstack-query.md
      errors.md
```

## Doc map

- `create-micro-api.md`: API client creation, shared config, `extend`, and auth headers.
- `resources.md`: Defining REST resources, endpoints, variables, request mappers, and keys.
- `tanstack-query.md`: Using generated query and mutation configs with TanStack Query.
- `create-token-provider.md`: Access tokens, refresh tokens, retry behavior, and auth modes.
- `errors.md`: `MicroApiError`, `MicroAuthRequiredError`, and API-level error handling.
