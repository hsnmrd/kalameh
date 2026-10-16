import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@/test/test-utils"
import InstitutesPage from "../page"
import { ROLES } from "@workspace/types"
import institutesMessagesFa from "@/messages/fa/institutes.json"
import commonMessagesFa from "@/messages/fa/common.json"

const mockUsePermissions = vi.fn()

vi.mock("@/lib/hooks", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    usePermissions: () => mockUsePermissions(),
    useModal: () => ({
      openModal: vi.fn(),
      closeModal: vi.fn(),
    }),
  }
})

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    institutesResource: {
      ...(actual.institutesResource as Record<string, unknown>),
      list: {
        toQuery: vi.fn(() => ({
          queryKey: ["institutes", "list"],
          queryFn: vi.fn(),
        })),
        baseKey: vi.fn(() => ["institutes", "list"]),
      },
    },
  }
})

describe("InstitutesPage RBAC", () => {
  const customMessages = {
    institutes: institutesMessagesFa,
    common: commonMessagesFa,
  }

  it("should block institute ADMIN and render ForbiddenState", () => {
    mockUsePermissions.mockReturnValue({
      user: {
        id: "admin-1",
        role: ROLES.ADMIN,
        instituteId: "inst-1",
      },
      isLoading: false,
      hasPermission: () => true,
    })

    render(<InstitutesPage />, { messages: customMessages })

    expect(
      screen.getByText(commonMessagesFa.forbidden.title)
    ).toBeInTheDocument()
    expect(
      screen.getByText(commonMessagesFa.forbidden.badge)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(institutesMessagesFa.addInstitute)
    ).not.toBeInTheDocument()
  })

  it("should allow SUPER_ADMIN to see the institutes page shell", () => {
    mockUsePermissions.mockReturnValue({
      user: {
        id: "super-1",
        role: ROLES.SUPER_ADMIN,
      },
      isLoading: false,
      hasPermission: () => true,
    })

    render(<InstitutesPage />, { messages: customMessages })

    expect(
      screen.queryByText(commonMessagesFa.forbidden.title)
    ).not.toBeInTheDocument()
  })
})
