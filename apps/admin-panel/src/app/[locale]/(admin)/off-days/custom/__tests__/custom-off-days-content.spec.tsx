import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@/test/test-utils"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import settingMessagesFa from "@/messages/fa/setting.json"
import commonMessagesFa from "@/messages/fa/common.json"
import { institutesResource } from "@/lib/api"
import { CustomOffDaysContent } from "../components/custom-off-days-content"

const mockInstituteId = "11111111-1111-1111-1111-111111111111"

vi.mock("@/lib/stores", () => ({
  useActiveInstitute: () => ({ activeInstituteId: mockInstituteId }),
}))

describe("CustomOffDaysContent", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(
      institutesResource.detail.toQuery(mockInstituteId).queryKey,
      { id: mockInstituteId, observeOfficialHolidays: true }
    )
  })

  function renderContent() {
    return render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider
          locale="fa"
          messages={{ setting: settingMessagesFa, common: commonMessagesFa }}
        >
          <CustomOffDaysContent />
        </NextIntlClientProvider>
      </QueryClientProvider>
    )
  }

  it("shows the custom off-days empty state on its own page", () => {
    queryClient.setQueryData(
      institutesResource.customOffDays.toQuery(mockInstituteId).queryKey,
      []
    )

    renderContent()

    expect(screen.getByText("افزودن روز تعطیل")).toBeInTheDocument()
    expect(
      screen.getByText("هیچ تعطیلی اختصاصی برای موسسه ثبت نشده است.")
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "تقویم تعطیلات" })).toHaveAttribute(
      "href",
      "/off-days"
    )
  })

  it("lists custom off-days and opens their delete confirmation", async () => {
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

    renderContent()
    fireEvent.click(
      screen.getByRole("button", { name: "حذف اردوی درون‌استانی" })
    )

    await waitFor(() => {
      expect(screen.getByText("حذف روز تعطیل")).toBeInTheDocument()
    })
  })

  it("opens the add off-day form", async () => {
    queryClient.setQueryData(
      institutesResource.customOffDays.toQuery(mockInstituteId).queryKey,
      []
    )

    renderContent()
    fireEvent.click(screen.getByRole("button", { name: "افزودن روز تعطیل" }))

    await waitFor(() => {
      expect(screen.getByText("افزودن تعطیلی جدید")).toBeInTheDocument()
      expect(screen.getByText("عنوان مناسبت")).toBeInTheDocument()
    })
  })
})
