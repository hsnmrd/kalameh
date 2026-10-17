import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@/test/test-utils"
import StudentProfilePage from "../page"
import profileMessagesFa from "@/messages/fa/profile.json"
import commonMessagesFa from "@/messages/fa/common.json"

const mockUser = {
  id: "student-1",
  instituteId: "inst-1",
  role: "STUDENT",
  firstName: "علی",
  lastName: "رضایی",
  phone: "09123456789",
  nationalCode: "0012345678",
  avatarUrl: null,
  isActive: true,
  institute: {
    id: "inst-1",
    name: "آموزشگاه زبان کلمه",
    subdomain: "kalameh",
    logoUrl: null,
  },
  studentProfile: {
    id: "prof-1",
    fatherName: "رضا",
    birthDate: "2005-06-15T00:00:00.000Z",
    gender: "MALE",
    emergencyPhone: "09129876543",
    address: "تهران، خیابان آزادی، پلاک ۱۲",
  },
  createdAt: "2024-01-10T12:00:00.000Z",
  updatedAt: "2024-01-10T12:00:00.000Z",
}

const mockLogoutMutate = vi.fn().mockResolvedValue({ message: "ok" })
const mockPush = vi.fn()

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => "/profile",
  useIsRtl: () => true,
  Link: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    authResource: {
      ...(actual.authResource as Record<string, unknown>),
      me: {
        toQuery: vi.fn(() => ({
          queryKey: ["auth", "me"],
          queryFn: vi.fn(() => Promise.resolve(mockUser)),
          initialData: mockUser,
        })),
      },
      logout: {
        toMutation: vi.fn(() => ({
          mutationKey: ["auth", "logout"],
          mutationFn: mockLogoutMutate,
        })),
      },
    },
  }
})

describe("StudentProfilePage", () => {
  const customMessages = {
    profile: profileMessagesFa,
    common: commonMessagesFa,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders profile square header with full name, phone, initials, and active badge", () => {
    render(<StudentProfilePage />, { messages: customMessages })

    expect(screen.getAllByText("علی رضایی").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("09123456789").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("ع")).toBeInTheDocument()
    expect(
      screen.getAllByText(profileMessagesFa.active).length
    ).toBeGreaterThanOrEqual(1)
  })

  it("renders personal details (name, national code, father name, birth date, gender)", () => {
    render(<StudentProfilePage />, { messages: customMessages })

    expect(screen.getByText(profileMessagesFa.personalInfo)).toBeInTheDocument()
    expect(screen.getByText("0012345678")).toBeInTheDocument()
    expect(screen.getByText("رضا")).toBeInTheDocument()
    expect(screen.getByText(profileMessagesFa.genderMale)).toBeInTheDocument()
  })

  it("renders academic & institute details", () => {
    render(<StudentProfilePage />, { messages: customMessages })

    expect(screen.getByText(profileMessagesFa.academicInfo)).toBeInTheDocument()
    expect(screen.getByText("آموزشگاه زبان کلمه")).toBeInTheDocument()
    expect(screen.getByText(profileMessagesFa.studentRole)).toBeInTheDocument()
  })

  it("renders contact details including emergency phone and address", () => {
    render(<StudentProfilePage />, { messages: customMessages })

    expect(screen.getByText(profileMessagesFa.contactInfo)).toBeInTheDocument()
    expect(screen.getByText("09129876543")).toBeInTheDocument()
    expect(screen.getByText("تهران، خیابان آزادی، پلاک ۱۲")).toBeInTheDocument()
  })

  it("renders logout option at the end of the page and triggers logout mutation on click", async () => {
    render(<StudentProfilePage />, { messages: customMessages })

    const logoutButton = screen.getByRole("button", {
      name: profileMessagesFa.logout,
    })
    expect(logoutButton).toBeInTheDocument()

    fireEvent.click(logoutButton)
    await waitFor(() => {
      expect(mockLogoutMutate).toHaveBeenCalledTimes(1)
    })
  })

  it("navigates to /setting when settings button is clicked", () => {
    render(<StudentProfilePage />, { messages: customMessages })

    const settingsButton = screen.getByRole("button", {
      name: profileMessagesFa.settings,
    })
    fireEvent.click(settingsButton)

    expect(mockPush).toHaveBeenCalledWith("/setting")
  })
})
