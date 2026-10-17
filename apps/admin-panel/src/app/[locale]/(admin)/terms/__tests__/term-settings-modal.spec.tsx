import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { TermSettingsModal } from "../components/term-settings-modal"

const mockMutate = vi.fn()

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    institutesResource: {
      ...actual.institutesResource,
      detail: {
        toQuery: () => ({
          queryKey: ["institutes", "detail"],
          queryFn: () =>
            Promise.resolve({
              id: "inst-1",
              termRegistrationDaysBeforeStart: 10,
              termRegistrationDaysAfterStart: 7,
              termExamDaysBeforeEnd: 2,
            }),
        }),
        baseKey: () => ["institutes", "detail"],
      },
      update: {
        toMutation: () => ({
          mutationFn: mockMutate,
          mutate: mockMutate,
          isPending: false,
        }),
      },
    },
  }
})

vi.mock("@/lib/stores", () => ({
  useActiveInstitute: () => ({
    activeInstituteId: "inst-1",
  }),
}))

describe("TermSettingsModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders modal with input fields when open is true", async () => {
    render(<TermSettingsModal open={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(
        screen.getByText(/شروع ثبت‌نام قبل از آغاز ترم/i)
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(/ادامه ثبت‌نام پس از آغاز کلاس‌ها/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/بازه امتحانات پایانی قبل از اتمام ترم/i)
    ).toBeInTheDocument()
  })

  it("submits the form with updated values", async () => {
    const handleClose = vi.fn()
    render(<TermSettingsModal open={true} onClose={handleClose} />)

    await waitFor(() => {
      expect(
        screen.getByText(/شروع ثبت‌نام قبل از آغاز ترم/i)
      ).toBeInTheDocument()
    })

    const submitBtn = screen.getByRole("button", {
      name: /ذخیره تنظیمات|ذخیره/i,
    })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled()
    })
  })
})
