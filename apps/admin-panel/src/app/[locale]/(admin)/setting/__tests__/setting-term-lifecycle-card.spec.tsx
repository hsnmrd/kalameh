import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { SettingTermLifecycleCard } from "../components/setting-term-lifecycle-card"

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

describe("SettingTermLifecycleCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders card with fields for registration and exam days", async () => {
    render(<SettingTermLifecycleCard />)

    expect(
      screen.getByText(
        /بازه زمانی و چرخه عمر ترم‌های آموزشی|termLifecycle\.title/i
      )
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.getByText(/شروع ثبت‌نام قبل از آغاز ترم|regDaysBeforeLabel/i)
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(/ادامه ثبت‌نام پس از آغاز کلاس‌ها|regDaysAfterLabel/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /بازه امتحانات پایانی قبل از اتمام ترم|examDaysBeforeLabel/i
      )
    ).toBeInTheDocument()
  })

  it("submits the form when save button is clicked with modified values", async () => {
    render(<SettingTermLifecycleCard />)

    await waitFor(() => {
      expect(
        screen.getByText(/شروع ثبت‌نام قبل از آغاز ترم|regDaysBeforeLabel/i)
      ).toBeInTheDocument()
    })

    const inputs = screen.getAllByRole("spinbutton")
    expect(inputs.length).toBe(3)

    // Change value to make form dirty
    fireEvent.change(inputs[0], { target: { value: "14" } })

    const saveBtn = screen.getByRole("button", {
      name: /ذخیره تغییرات|ذخیره|save/i,
    })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled()
      expect(mockMutate.mock.calls[0][0]).toMatchObject({
        id: "inst-1",
        body: expect.objectContaining({
          termRegistrationDaysBeforeStart: 14,
        }),
      })
    })
  })
})
