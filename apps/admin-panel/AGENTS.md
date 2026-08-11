# apps/web frontend rules

- Read `DESIGN.md` before changing `apps/web` UI. Treat it as the visual source of truth unless the user explicitly overrides it.
- Use shadcn/ui for UI composition in `apps/web`. Prefer existing shadcn components and project aliases before custom markup.
- Use `packages/ui/src/styles/globals.css` as the source for shared colors, shadows, radii, and similar design tokens. Add or adjust CSS variables there instead of hardcoding one-off visual values in components.
- Support dark theme through CSS variables. Do not use `dark:...` Tailwind variants inside `className`; use semantic tokens and variable-backed utilities that resolve for both light and dark themes.
- Use `motion/react` for animating elements in React UI. Prefer its primitives and APIs over ad hoc CSS animation logic for interactive component motion.
- For web forms, use `react-hook-form` for form state and `zod` for schema validation. Do not build ad hoc form state or validation for non-trivial forms.
- For server state and REST calls, use TanStack React Query with `micro-rq`. Define REST resources with `micro-rq` and pass generated query/mutation configs to React Query instead of hand-writing fetch hooks or wrapper APIs.
- Do not create or modify `apps/web` source files so they exceed 250 lines. Split UI, hooks, helpers, and data definitions into focused files before reaching that size.
