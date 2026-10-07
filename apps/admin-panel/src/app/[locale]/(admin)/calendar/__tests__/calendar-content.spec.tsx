import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import settingMessagesFa from "../../../../../messages/fa/setting.json"
import commonMessagesFa from "../../../../../messages/fa/common.json"
import { institutesResource, termsResource, classesResource } from "@/lib/api"
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
    queryClient.setQueryData(
      termsResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
    queryClient.setQueryData(
      classesResource.list.toQuery({ instituteId: mockInstituteId }).queryKey,
      []
    )
  })

  it("renders the institute calendar in view-only mode without off-day setting buttons", () => {
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

    // Verify legend and view-only status
    expect(screen.getByText("بازه ترم فعال")).toBeInTheDocument()
    expect(screen.getByText("تعطیل رسمی")).toBeInTheDocument()
    expect(screen.getByText("تعطیلی موسسه")).toBeInTheDocument()

    // Mutation bar is completely removed
    expect(
      screen.queryByText("رعایت تعطیلات رسمی تقویم ایران")
    ).not.toBeInTheDocument()

    // Setting off-days button/FAB is completely removed from this page
    expect(
      screen.queryByRole("link", { name: "تعطیلات اختصاصی" })
    ).not.toBeInTheDocument()
  })
})
