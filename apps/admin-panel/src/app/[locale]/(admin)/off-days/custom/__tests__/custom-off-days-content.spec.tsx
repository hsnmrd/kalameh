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

    expect(screen.getAllByText("افزودن روز تعطیل")[0]).toBeInTheDocument()
    expect(
      screen.getAllByText("هیچ تعطیلی اختصاصی برای موسسه ثبت نشده است.")
    ).toHaveLength(2)
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
      screen.getAllByRole("button", { name: "حذف اردوی درون‌استانی" })[0]
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
    fireEvent.click(
      screen.getAllByRole("button", { name: "افزودن روز تعطیل" })[0]
    )

    await waitFor(() => {
      expect(screen.getByText("افزودن تعطیلی جدید")).toBeInTheDocument()
      expect(screen.getByText("عنوان مناسبت")).toBeInTheDocument()
    })
  })

  it("filters custom off-days using the search input", async () => {
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
        {
          id: "off-2",
          instituteId: mockInstituteId,
          date: "2024-11-15",
          title: "جشن فارغ‌التحصیلی",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    )

    renderContent()

    expect(screen.getAllByText("اردوی درون‌استانی").length).toBeGreaterThan(0)
    expect(screen.getAllByText("جشن فارغ‌التحصیلی").length).toBeGreaterThan(0)

    const searchInput = screen.getByPlaceholderText(
      "جستجوی عنوان یا تاریخ تعطیلی..."
    )
    fireEvent.change(searchInput, { target: { value: "فارغ‌التحصیلی" } })

    await waitFor(() => {
      expect(screen.queryByText("اردوی درون‌استانی")).not.toBeInTheDocument()
      expect(screen.getAllByText("جشن فارغ‌التحصیلی").length).toBeGreaterThan(0)
    })
  })
})
