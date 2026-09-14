import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import settingMessagesFa from "../../../../../messages/fa/setting.json"
import commonMessagesFa from "../../../../../messages/fa/common.json"
import { institutesResource } from "@/lib/api"
import { OffDaysContent } from "../components/off-days-content"

const mockInstituteId = "11111111-1111-1111-1111-111111111111"

vi.mock("@/lib/stores", () => ({
  useActiveInstitute: () => ({ activeInstituteId: mockInstituteId }),
}))

describe("OffDaysContent", () => {
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
      {
        id: mockInstituteId,
        observeOfficialHolidays: true,
        dismissedHolidays: [],
      }
    )
    queryClient.setQueryData(
      institutesResource.customOffDays.toQuery(mockInstituteId).queryKey,
      []
    )
  })

  it("keeps the official calendar focused and links to custom off-days", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider
          locale="fa"
          messages={{ setting: settingMessagesFa, common: commonMessagesFa }}
        >
          <OffDaysContent />
        </NextIntlClientProvider>
      </QueryClientProvider>
    )

    expect(
      screen.getByText("رعایت تعطیلات رسمی تقویم ایران")
    ).toBeInTheDocument()
    expect(screen.getByText("تقویم کاری و وضعیت روزها")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "تعطیلات اختصاصی" })
    ).toHaveAttribute("href", "/off-days/custom")
    expect(
      screen.queryByText("هیچ تعطیلی اختصاصی برای موسسه ثبت نشده است.")
    ).not.toBeInTheDocument()
  })
})
