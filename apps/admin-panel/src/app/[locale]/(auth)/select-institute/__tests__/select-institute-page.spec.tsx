import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import AdminSelectInstitutePage from "../page"

const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
  }),
  usePathname: () => "/select-institute",
  useIsRtl: () => true,
}))

describe("AdminSelectInstitutePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it("should redirect to /login when pending_auth is not in sessionStorage", () => {
    render(<AdminSelectInstitutePage />)
    expect(mockReplace).toHaveBeenCalledWith("/login")
  })

  it("should render institute list from pending_auth data", () => {
    sessionStorage.setItem(
      "pending_auth",
      JSON.stringify({
        phone: "09121111111",
        password: "password123",
        institutes: [
          {
            id: "inst-1",
            name: "آموزشگاه مرکزی",
            subdomain: "markaz",
            logoUrl: null,
          },
          {
            id: "inst-2",
            name: "آموزشگاه غرب",
            subdomain: "gharb",
            logoUrl: null,
          },
        ],
      })
    )

    render(<AdminSelectInstitutePage />)

    expect(screen.getByText("آموزشگاه مرکزی")).toBeInTheDocument()
    expect(screen.getByText("آموزشگاه غرب")).toBeInTheDocument()
    expect(screen.getByText("markaz")).toBeInTheDocument()
    expect(screen.getByText("gharb")).toBeInTheDocument()
  })

  it("should clear pending_auth and navigate to login when back button is clicked", () => {
    sessionStorage.setItem(
      "pending_auth",
      JSON.stringify({
        phone: "09121111111",
        password: "password123",
        institutes: [
          {
            id: "inst-1",
            name: "آموزشگاه مرکزی",
            subdomain: "markaz",
            logoUrl: null,
          },
        ],
      })
    )

    render(<AdminSelectInstitutePage />)

    const backButtons = screen.getAllByRole("button", {
      name: /بازگشت|Back/i,
    })
    fireEvent.click(backButtons[0]!)

    expect(sessionStorage.getItem("pending_auth")).toBeNull()
    expect(mockPush).toHaveBeenCalledWith("/login")
  })
})
