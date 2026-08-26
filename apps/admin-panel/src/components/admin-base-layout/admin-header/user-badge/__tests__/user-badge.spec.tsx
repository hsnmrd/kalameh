import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "../../../../../test/test-utils"
import { ROLES } from "@workspace/types"
import * as stores from "@/lib/stores"
import { UserBadge } from "../index"

const mockPush = vi.fn()
vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useIsRtl: () => true,
  Link: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe("UserBadge", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mockPush.mockReset()
  })

  it("opens profile details in a bottom-sheet drawer on mobile", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList
    )

    const onLogout = vi.fn()
    render(
      <UserBadge
        user={{
          firstName: "علی",
          lastName: "رضایی",
          phone: "09121234567",
          role: ROLES.ADMIN,
          isActive: true,
        }}
        onLogout={onLogout}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "اطلاعات کاربری" }))

    expect(
      await screen.findByRole("heading", { name: "اطلاعات کاربری" })
    ).toBeInTheDocument()
    expect(screen.getByText("علی رضایی")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "خروج از حساب" }))
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it("displays active institute branding in header trigger and gives change/close actions in popover for Super Admin", () => {
    const clearActiveInstitute = vi.fn()

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstitute: {
        id: "inst-1",
        name: "آموزشگاه کلمه تهران",
        subdomain: "tehran",
        phones: [],
        enabledModules: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      activeInstituteId: "inst-1",
      isSuperAdminManaging: true,
      institutes: [],
      isLoadingInstitutes: false,
      selectInstitute: vi.fn(),
      clearActiveInstitute,
      setActiveInstitute: vi.fn(),
    })

    render(
      <UserBadge
        role={ROLES.SUPER_ADMIN}
        user={{
          firstName: "مدیر",
          lastName: "ارشد",
          role: ROLES.SUPER_ADMIN,
          isActive: true,
        }}
      />
    )

    // Header trigger shows active institute initial ("آم")
    expect(screen.getByText("آم")).toBeInTheDocument()

    // Open popover
    fireEvent.click(screen.getByRole("button", { name: "اطلاعات کاربری" }))

    // Active Institute details & actions are shown
    expect(screen.getByText("آموزشگاه کلمه تهران")).toBeInTheDocument()
    expect(screen.getByText("tehran.kalameh.ir")).toBeInTheDocument()
    expect(screen.getByText("در حال مدیریت آموزشگاه")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "تغییر آموزشگاه" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "خروج از آموزشگاه" })
    ).toBeInTheDocument()

    // Click close institute
    fireEvent.click(screen.getByRole("button", { name: "خروج از آموزشگاه" }))
    expect(clearActiveInstitute).toHaveBeenCalledOnce()
    expect(mockPush).toHaveBeenCalledWith("/institutes")
  })

  it("shows select institute action button in popover when Super Admin has no active institute", () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstitute: null,
      activeInstituteId: undefined,
      isSuperAdminManaging: false,
      institutes: [],
      isLoadingInstitutes: false,
      selectInstitute: vi.fn(),
      clearActiveInstitute: vi.fn(),
      setActiveInstitute: vi.fn(),
    })

    render(
      <UserBadge
        role={ROLES.SUPER_ADMIN}
        user={{
          firstName: "مدیر",
          lastName: "ارشد",
          role: ROLES.SUPER_ADMIN,
          isActive: true,
        }}
      />
    )

    // Open popover
    fireEvent.click(screen.getByRole("button", { name: "اطلاعات کاربری" }))

    expect(
      screen.getByRole("button", { name: "انتخاب آموزشگاه" })
    ).toBeInTheDocument()
  })
})
