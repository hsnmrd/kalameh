import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@/test/test-utils"
import { ClassesFilter } from "../components/classes-filter"
import * as stores from "@/lib/stores"
import { termsResource, coursesResource } from "@/lib/api"

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/classes",
  useIsRtl: () => true,
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("@/lib/stores", () => ({
  useActiveInstitute: vi.fn(),
}))

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    termsResource: {
      ...actual.termsResource,
      list: {
        toQuery: vi.fn(),
      },
    },
    coursesResource: {
      ...actual.coursesResource,
      list: {
        toQuery: vi.fn(),
      },
    },
  }
})

describe("ClassesFilter Component", () => {
  const mockActiveTerm = {
    id: "term-1",
    title: "مهر و آبان ۱۴۰۵",
    startDate: "2026-10-01",
    endDate: "2026-11-30",
    isActive: true,
    lifecycleStatus: "ACTIVE",
  }

  const mockPastTerm = {
    id: "term-2",
    title: "تابستان ۱۴۰۵",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    isActive: false,
    lifecycleStatus: "COMPLETED",
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(stores.useActiveInstitute).mockReturnValue({
      activeInstituteId: "inst-1",
    } as any)

    vi.mocked(termsResource.list.toQuery).mockReturnValue({
      queryKey: ["terms", "list", "inst-1"],
      queryFn: async () => [mockActiveTerm, mockPastTerm],
    } as any)

    vi.mocked(coursesResource.list.toQuery).mockReturnValue({
      queryKey: ["courses", "list", "inst-1"],
      queryFn: async () => [],
    } as any)
  })

  it("renders filter bar with search input and filter trigger button", () => {
    render(
      <ClassesFilter
        termId="term-1"
        onTermChange={vi.fn()}
        courseId=""
        onCourseChange={vi.fn()}
        search=""
        onSearchChange={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText("جستجو")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /فیلتر/i })).toBeInTheDocument()
  })

  it("calls onTermChange with 'all' when filters are cleared", async () => {
    const handleTermChange = vi.fn()
    const handleCourseChange = vi.fn()

    render(
      <ClassesFilter
        termId="term-1"
        onTermChange={handleTermChange}
        courseId="course-1"
        onCourseChange={handleCourseChange}
        search=""
        onSearchChange={vi.fn()}
      />
    )

    // Open filter dialog by clicking filter button
    const filterBtn = screen.getByRole("button", { name: /فیلتر/i })
    fireEvent.click(filterBtn)

    // Find and click clear filters button
    await waitFor(() => {
      const clearBtn = screen.getByRole("button", {
        name: /پاک.*کردن فیلترها/i,
      })
      fireEvent.click(clearBtn)
    })

    expect(handleTermChange).toHaveBeenCalledWith("all")
    expect(handleCourseChange).toHaveBeenCalledWith("")
  })
})
