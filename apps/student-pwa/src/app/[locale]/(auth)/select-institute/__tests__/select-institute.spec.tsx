import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import SelectInstitutePage from "../page"
import { authResource } from "@/lib/api"

const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/select-institute",
  useIsRtl: () => true,
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

describe("SelectInstitutePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it("should redirect to /login when pending_auth is not in sessionStorage", () => {
    render(<SelectInstitutePage />)
    expect(mockReplace).toHaveBeenCalledWith("/login")
  })

  it("should render institute list from pending_auth data", () => {
    sessionStorage.setItem(
      "pending_auth",
      JSON.stringify({
        phone: "09123456789",
        password: "password123",
        institutes: [
          {
            id: "inst-1",
            name: "آموزشگاه تهران",
            subdomain: "tehran",
          },
          {
            id: "inst-2",
            name: "آموزشگاه شیراز",
            subdomain: "shiraz",
          },
        ],
      })
    )

    render(<SelectInstitutePage />)

    expect(screen.getByText("آموزشگاه تهران")).toBeInTheDocument()
    expect(screen.getByText("آموزشگاه شیراز")).toBeInTheDocument()
    expect(screen.getByText("tehran")).toBeInTheDocument()
    expect(screen.getByText("shiraz")).toBeInTheDocument()
  })

  it("should clear pending_auth and navigate to login when back button is clicked", () => {
    sessionStorage.setItem(
      "pending_auth",
      JSON.stringify({
        phone: "09123456789",
        password: "password123",
        institutes: [
          {
            id: "inst-1",
            name: "آموزشگاه تهران",
            subdomain: "tehran",
          },
        ],
      })
    )

    render(<SelectInstitutePage />)

    const backButtons = screen.getAllByRole("button", {
      name: /بازگشت|Back/i,
    })
    fireEvent.click(backButtons[0]!)

    expect(sessionStorage.getItem("pending_auth")).toBeNull()
    expect(mockPush).toHaveBeenCalledWith("/login")
  })
})
