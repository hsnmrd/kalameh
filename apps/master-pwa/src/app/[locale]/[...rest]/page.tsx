import { notFound } from "next/navigation"

/**
 * Catch-all route for unmatched localized paths (e.g. /[locale]/unknown/path).
 * Triggers `notFound()` so Next.js renders the localized `[locale]/not-found.tsx`
 * with active translations, RTL/LTR layout, and styling preserved.
 */
export default function CatchAllPage() {
  notFound()
}
