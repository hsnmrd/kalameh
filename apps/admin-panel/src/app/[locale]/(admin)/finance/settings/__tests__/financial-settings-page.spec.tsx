import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@/test/test-utils"
import FinancialSettingsPage from "../page"
import { FinancialSettingsForm } from "../components/financial-settings-form"
import { FinancialPreviewCard } from "../components/financial-preview-card"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import transactionsMessagesFa from "@/messages/fa/transactions.json"
import commonMessagesFa from "@/messages/fa/common.json"

const mockInstitute = {
  id: "inst-1",
  name: "آموزشگاه نمونه",
  subdomain: "nemooneh",
  isActive: true,
  enabledModules: [APP_MODULES.FINANCE],
  bankAccountName: "آموزشگاه زبان نمونه",
  bankCardNumber: "6037991812345678",
  bankShaba: "IR120120000000001234567890",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockMutate = vi.fn()

vi.mock("@/lib/stores", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    useActiveInstitute: () => ({
      activeInstitute: mockInstitute,
      activeInstituteId: "inst-1",
      setActiveInstitute: vi.fn(),
    }),
  }
})

vi.mock("@/lib/hooks", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    usePermissions: () => ({
      user: { id: "admin-1", role: "ADMIN", instituteId: "inst-1" },
      isLoading: false,
      hasPermission: () => true,
    }),
  }
})

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    institutesResource: {
      ...(actual.institutesResource as Record<string, unknown>),
      detail: {
        toQuery: vi.fn(() => ({
          queryKey: ["institutes", "detail", "inst-1"],
          queryFn: vi.fn(() => Promise.resolve(mockInstitute)),
          initialData: mockInstitute,
        })),
        baseKey: vi.fn(() => ["institutes", "detail"]),
      },
      update: {
        toMutation: vi.fn(() => ({
          mutationFn: mockMutate,
          mutate: mockMutate,
          isPending: false,
        })),
      },
    },
  }
})

describe("FinancialSettingsPage", () => {
  const customMessages = {
    transactions: transactionsMessagesFa,
    common: commonMessagesFa,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders page header, banner, and populated form fields", () => {
    render(<FinancialSettingsPage />, { messages: customMessages })

    expect(
      screen.getByText(transactionsMessagesFa.settings.infoTitle)
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue("آموزشگاه زبان نمونه")).toBeInTheDocument()
    expect(screen.getByDisplayValue("6037991812345678")).toBeInTheDocument()
    expect(
      screen.getByDisplayValue("IR120120000000001234567890")
    ).toBeInTheDocument()
  })

  it("renders live preview card with formatted 4-digit card chunks and copy button", () => {
    render(
      <FinancialPreviewCard
        bankAccountName="آموزشگاه زبان نمونه"
        bankCardNumber="6037991812345678"
        bankShaba="IR120120000000001234567890"
      />,
      { messages: customMessages }
    )

    expect(screen.getByText("6037 9918 1234 5678")).toBeInTheDocument()
    expect(screen.getByText("آموزشگاه زبان نمونه")).toBeInTheDocument()
    expect(screen.getByText("IR120120000000001234567890")).toBeInTheDocument()
    expect(
      screen.getByText(transactionsMessagesFa.settings.copyCard)
    ).toBeInTheDocument()
  })

  it("submits updated financial info when form is modified", async () => {
    render(<FinancialSettingsForm institute={mockInstitute as any} />, {
      messages: customMessages,
    })

    const cardInput = screen.getByDisplayValue("6037991812345678")
    fireEvent.change(cardInput, {
      target: { value: "5022291011223344" },
    })

    const saveButton = screen.getByRole("button", {
      name: transactionsMessagesFa.settings.save,
    })
    expect(saveButton).toBeEnabled()

    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "inst-1",
          body: expect.objectContaining({
            bankCardNumber: "5022291011223344",
            bankAccountName: "آموزشگاه زبان نمونه",
            bankShaba: "IR120120000000001234567890",
          }),
        }),
        expect.anything()
      )
    })
  })
})
