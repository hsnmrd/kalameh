import "@testing-library/jest-dom/vitest"
import * as React from "react"
import { vi } from "vitest"

// Mock window.matchMedia for embla-carousel and responsive components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver and ResizeObserver for carousel
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})
Object.defineProperty(global, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
})
Object.defineProperty(global, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
})

let currentTestUrl = new URL("http://localhost/")
const routerListeners = new Set<() => void>()

function updateTestUrl(url: string) {
  currentTestUrl = new URL(url, "http://localhost")
  routerListeners.forEach((listener) => listener())
}

beforeEach(() => {
  currentTestUrl = new URL("http://localhost/")
})

vi.mock("next/navigation", () => ({
  useSearchParams: () => {
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0)
    React.useEffect(() => {
      routerListeners.add(forceUpdate)
      return () => {
        routerListeners.delete(forceUpdate)
      }
    }, [])
    return currentTestUrl.searchParams
  },
  usePathname: () => currentTestUrl.pathname,
  useRouter: () => ({
    push: vi.fn((url: string) => updateTestUrl(url)),
    replace: vi.fn((url: string) => updateTestUrl(url)),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}))

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
    push: vi.fn((url: string) => updateTestUrl(url)),
    replace: vi.fn((url: string) => updateTestUrl(url)),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => currentTestUrl.pathname,
  useIsRtl: () => false,
  routing: {
    locales: ["fa", "en"],
    defaultLocale: "fa",
  },
}))
