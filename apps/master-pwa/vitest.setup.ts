import "@testing-library/jest-dom/vitest"
import * as React from "react"
import { vi } from "vitest"

vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    className,
    onClick,
  }: {
    children: React.ReactNode
    href: string
    className?: string
    onClick?: () => void
  }) => React.createElement("a", { href, className, onClick }, children),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/",
  useIsRtl: () => false,
  routing: {
    locales: ["fa", "en"],
    defaultLocale: "fa",
  },
}))
