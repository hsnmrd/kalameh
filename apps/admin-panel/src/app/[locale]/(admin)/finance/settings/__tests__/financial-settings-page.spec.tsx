import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@/test/test-utils"
import FinancialSettingsPage from "../page"
import { FinancialSettingsForm } from "../components/financial-settings-form"
import { FinancialPreviewCard } from "../components/financial-preview-card"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import {
  HeaderActionsProvider,
  useHeaderActions,
  type BackNavigationConfig,
} from "@/components/admin-base-layout/header-actions-context"
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
const mockDeleteMutate = vi.fn()

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
      updateBankInfo: {
        toMutation: vi.fn(() => ({
          mutationFn: mockMutate,
          mutate: mockMutate,
          isPending: false,
        })),
      },
      deleteBankInfo: {
        toMutation: vi.fn(() => ({
          mutationFn: mockDeleteMutate,
          mutate: mockDeleteMutate,
          isPending: false,
        })),
      },
    },
    termsResource: {
      ...(actual.termsResource as Record<string, unknown>),
      list: {
        toQuery: vi.fn(() => ({
          queryKey: ["terms", "list"],
          queryFn: vi.fn(() => Promise.resolve([])),
          initialData: [],
        })),
        baseKey: vi.fn(() => ["terms", "list"]),
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

  it("renders delete button, opens confirmation dialog and deletes bank info upon confirm", async () => {
    render(<FinancialSettingsForm institute={mockInstitute as any} />, {
      messages: customMessages,
    })

    const deleteBtn = screen.getByRole("button", {
      name: transactionsMessagesFa.settings.deleteBankInfo,
    })
    expect(deleteBtn).toBeInTheDocument()

    fireEvent.click(deleteBtn)

    expect(
      screen.getByText(
        transactionsMessagesFa.settings.deleteBankInfoConfirmTitle
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        transactionsMessagesFa.settings.deleteBankInfoConfirmDescription
      )
    ).toBeInTheDocument()

    const confirmActionBtn = screen.getByRole("button", {
      name: transactionsMessagesFa.settings.delete,
    })
    fireEvent.click(confirmActionBtn)

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith("inst-1", expect.anything())
    })
  })

  it("shows warning and disables inputs/buttons when term registration is active", () => {
    const instituteWithActiveRegistration = {
      ...mockInstitute,
      hasActiveRegistrationTerm: true,
    }

    render(
      <FinancialSettingsForm
        institute={instituteWithActiveRegistration as any}
      />,
      {
        messages: customMessages,
      }
    )

    expect(
      screen.getByTestId("registration-active-warning")
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        transactionsMessagesFa.settings.registrationActiveWarningTitle
      )
    ).toBeInTheDocument()

    const cardInput = screen.getByDisplayValue("6037991812345678")
    expect(cardInput).toBeDisabled()

    const saveButton = screen.getByRole("button", {
      name: transactionsMessagesFa.settings.save,
    })
    expect(saveButton).toBeDisabled()

    const deleteButton = screen.getByRole("button", {
      name: transactionsMessagesFa.settings.deleteBankInfo,
    })
    expect(deleteButton).toBeDisabled()
  })

  it("sanitizes literal null strings and displays empty placeholders", () => {
    const instituteWithNullStrings = {
      ...mockInstitute,
      bankAccountName: "null",
      bankCardNumber: "null",
      bankShaba: "null",
    }

    render(
      <FinancialSettingsForm institute={instituteWithNullStrings as any} />,
      {
        messages: customMessages,
      }
    )

    expect(screen.queryByDisplayValue("null")).not.toBeInTheDocument()
    expect(screen.getByText("— — — —")).toBeInTheDocument()
  })

  it("configures back navigation to /transactions in HeaderActionsContext", () => {
    let capturedBackNav: BackNavigationConfig | null = null

    function TestConsumer() {
      const { backNavigation } = useHeaderActions()
      capturedBackNav = backNavigation
      return null
    }

    render(
      <HeaderActionsProvider>
        <FinancialSettingsPage />
        <TestConsumer />
      </HeaderActionsProvider>,
      { messages: customMessages }
    )

    expect(capturedBackNav).toEqual({
      backHref: "/transactions",
      backLabel: commonMessagesFa.nav.finance,
    })
  })
})
