import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { SettingOffDaysCard } from "../components/setting-off-days-card"
import { institutesResource } from "@/lib/api"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import settingMessagesFa from "../../../../../messages/fa/setting.json"
import commonMessagesFa from "../../../../../messages/fa/common.json"
import * as React from "react"

const messages = {
  setting: settingMessagesFa,
  common: commonMessagesFa,
}

const mockInstituteId = "11111111-1111-1111-1111-111111111111"

vi.mock("@/lib/stores", () => ({
  useActiveInstitute: () => ({
    activeInstituteId: mockInstituteId,
    activeInstitute: { id: mockInstituteId, name: "موسسه تست" },
  }),
}))

function renderWithClient(ui: React.ReactElement, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="fa" messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

describe("SettingOffDaysCard Component", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it("renders the official holidays toggle and custom off-days section", async () => {
    queryClient.setQueryData(
      institutesResource.detail.toQuery(mockInstituteId).queryKey,
      {
        id: mockInstituteId,
        name: "موسسه تست",
        observeOfficialHolidays: true,
      }
    )
    queryClient.setQueryData(
      institutesResource.customOffDays.toQuery(mockInstituteId).queryKey,
      []
    )

    renderWithClient(<SettingOffDaysCard />, queryClient)

    expect(screen.getByText("تعطیلات و تقویم موسسه")).toBeInTheDocument()
    expect(
      screen.getByText("رعایت تعطیلات رسمی تقویم ایران")
    ).toBeInTheDocument()
    expect(screen.getByText("تعطیلات اختصاصی موسسه")).toBeInTheDocument()
    expect(screen.getByText("افزودن روز تعطیل")).toBeInTheDocument()
    expect(
      screen.getByText("هیچ تعطیلی اختصاصی برای موسسه ثبت نشده است.")
    ).toBeInTheDocument()
  })

  it("renders custom off-days list when present", async () => {
    queryClient.setQueryData(
      institutesResource.detail.toQuery(mockInstituteId).queryKey,
      {
        id: mockInstituteId,
        name: "موسسه تست",
        observeOfficialHolidays: true,
      }
    )
    queryClient.setQueryData(
      institutesResource.customOffDays.toQuery(mockInstituteId).queryKey,
      [
        {
          id: "off-1",
          instituteId: mockInstituteId,
          date: "2024-10-01",
          title: "اردوی درون‌استانی",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    )

    renderWithClient(<SettingOffDaysCard />, queryClient)

    expect(screen.getByText("اردوی درون‌استانی")).toBeInTheDocument()
  })

  it("opens delete modal when clicking trash icon", async () => {
    queryClient.setQueryData(
      institutesResource.detail.toQuery(mockInstituteId).queryKey,
      {
        id: mockInstituteId,
        name: "موسسه تست",
        observeOfficialHolidays: true,
      }
    )
    queryClient.setQueryData(
      institutesResource.customOffDays.toQuery(mockInstituteId).queryKey,
      [
        {
          id: "off-1",
          instituteId: mockInstituteId,
          date: "2024-10-01",
          title: "اردوی درون‌استانی",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    )

    renderWithClient(<SettingOffDaysCard />, queryClient)

    const buttons = screen.getAllByRole("button")
    // Find button containing svg/trash
    const deleteBtn = buttons.find((b) => b.querySelector("svg.lucide-trash-2"))
    expect(deleteBtn).toBeDefined()
    if (deleteBtn) {
      fireEvent.click(deleteBtn)
      await waitFor(() => {
        expect(screen.getByText("حذف روز تعطیل")).toBeInTheDocument()
      })
    }
  })

  it("opens add off-day modal without description and shows off-days in calendar", async () => {
    queryClient.setQueryData(
      institutesResource.detail.toQuery(mockInstituteId).queryKey,
      {
        id: mockInstituteId,
        name: "موسسه تست",
        observeOfficialHolidays: true,
      }
    )
    queryClient.setQueryData(
      institutesResource.customOffDays.toQuery(mockInstituteId).queryKey,
      [
        {
          id: "off-1",
          instituteId: mockInstituteId,
          date: "2024-10-01",
          title: "اردوی درون‌استانی",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    )

    renderWithClient(<SettingOffDaysCard />, queryClient)

    const addBtn = screen.getByRole("button", { name: /افزودن روز تعطیل/i })
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(screen.getByText("افزودن تعطیلی جدید")).toBeInTheDocument()
      expect(screen.getByText("عنوان مناسبت")).toBeInTheDocument()
    })

    // Confirm modal description is NOT rendered per modal rules
    expect(
      screen.queryByText(settingMessagesFa.offDays.addModalDescription)
    ).not.toBeInTheDocument()

    // Click the date picker trigger to open calendar
    const datePickerTrigger = screen.getByRole("button", {
      name: /انتخاب تاریخ/i,
    })
    fireEvent.click(datePickerTrigger)

    // Calendar should be visible and highlight off-days
    await waitFor(() => {
      const offDayCells = document.querySelectorAll(
        "td[class*='text-destructive']"
      )
      expect(offDayCells.length).toBeGreaterThan(0)
    })
  })

  it("uses unified date range picker without mode tabs in add modal", async () => {
    queryClient.setQueryData(
      institutesResource.detail.toQuery(mockInstituteId).queryKey,
      {
        id: mockInstituteId,
        name: "موسسه تست",
        observeOfficialHolidays: true,
      }
    )
    queryClient.setQueryData(
      institutesResource.customOffDays.toQuery(mockInstituteId).queryKey,
      []
    )

    renderWithClient(<SettingOffDaysCard />, queryClient)

    const addBtn = screen.getByRole("button", { name: /افزودن روز تعطیل/i })
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(screen.getByText("افزودن تعطیلی جدید")).toBeInTheDocument()
    })

    // Mode tabs should NOT exist
    expect(screen.queryByText("تک روز")).not.toBeInTheDocument()
    expect(screen.queryByText("بازه زمانی")).not.toBeInTheDocument()

    // Unified Date Field
    expect(screen.getByText("تاریخ")).toBeInTheDocument()
    const pickerTrigger = screen.getByRole("button", { name: /انتخاب تاریخ/i })
    expect(pickerTrigger).toBeInTheDocument()

    // Click trigger to open picker
    fireEvent.click(pickerTrigger)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "تأیید" })).toBeInTheDocument()
    })

    // Day buttons are interactive and picker stays open
    const confirmButton = screen.getByRole("button", { name: "تأیید" })
    const tables = document.querySelectorAll("table")
    const pickerTable = tables[tables.length - 1]
    const dayButtons = pickerTable?.querySelectorAll("td button") || []
    expect(dayButtons.length).toBeGreaterThan(0)
    const activeDayButton = dayButtons[10] || dayButtons[0]
    expect(activeDayButton).toBeDefined()
    fireEvent.click(activeDayButton!)

    // Picker is still open
    expect(confirmButton).not.toBeDisabled()

    // Confirm selection
    fireEvent.click(screen.getByRole("button", { name: "تأیید" }))
  })

  it("renders the interactive work calendar and legend", async () => {
    queryClient.setQueryData(
      institutesResource.detail.toQuery(mockInstituteId).queryKey,
      {
        id: mockInstituteId,
        name: "موسسه تست",
        observeOfficialHolidays: true,
        dismissedHolidays: [],
      }
    )
    queryClient.setQueryData(
      institutesResource.customOffDays.toQuery(mockInstituteId).queryKey,
      []
    )

    renderWithClient(<SettingOffDaysCard />, queryClient)

    expect(screen.getByText("تقویم کاری و وضعیت روزها")).toBeInTheDocument()
    expect(screen.getByText("تعطیل رسمی")).toBeInTheDocument()
    expect(screen.getByText("دایر در تعطیلی رسمی")).toBeInTheDocument()
    expect(screen.getByText("تعطیلی موسسه")).toBeInTheDocument()
  })
})
