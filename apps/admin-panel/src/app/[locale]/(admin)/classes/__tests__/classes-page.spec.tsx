import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@/test/test-utils"
import ClassesPage from "../page"
import * as stores from "@/lib/stores"
import * as hooks from "@/lib/hooks"
import { classesResource, termsResource, coursesResource } from "@/lib/api"
import { ROLES, APP_MODULES, PERMISSIONS } from "@workspace/types"

const { state } = vi.hoisted(() => ({
  state: {
    searchParams: new URLSearchParams(),
  },
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => state.searchParams,
}))

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

vi.mock("@/lib/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/hooks")>()
  return {
    ...actual,
    usePermissions: vi.fn(),
    useModal: () => ({
      openModal: vi.fn(),
      closeModal: vi.fn(),
    }),
  }
})

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    classesResource: {
      ...actual.classesResource,
      list: {
        toQuery: vi.fn(),
      },
    },
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

describe("ClassesPage Default Active Term Filter", () => {
  const mockActiveTerm = {
    id: "term-active-1",
    title: "مهر و آبان ۱۴۰۵",
    startDate: "2026-10-01",
    endDate: "2026-11-30",
    isActive: true,
    lifecycleStatus: "ACTIVE",
    classesCount: 5,
  }

  const mockPastTerm = {
    id: "term-past-1",
    title: "تابستان ۱۴۰۵",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    isActive: false,
    lifecycleStatus: "COMPLETED",
    classesCount: 3,
  }

  const mockClasses = [
    {
      id: "cls-1",
      title: "گروه A",
      termId: "term-active-1",
      courseId: "course-1",
      capacity: 15,
      fee: 1000000,
      enrolledCount: 10,
      term: mockActiveTerm,
      course: { id: "course-1", title: "انگلیسی مقدماتی" },
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    state.searchParams = new URLSearchParams()

    vi.mocked(stores.useActiveInstitute).mockReturnValue({
      activeInstituteId: "inst-1",
      activeInstitute: {
        id: "inst-1",
        title: "مرکزی",
        enabledModules: [APP_MODULES.CLASSES_COURSES],
      },
    } as any)

    vi.mocked(hooks.usePermissions).mockReturnValue({
      user: {
        id: "u-1",
        role: ROLES.SUPER_ADMIN,
        permissions: [PERMISSIONS.VIEW_CLASSES],
      },
      hasPermission: () => true,
    } as any)

    vi.mocked(termsResource.list.toQuery).mockReturnValue({
      queryKey: ["terms", "list", "inst-1"],
      queryFn: async () => [mockPastTerm, mockActiveTerm],
    } as any)

    vi.mocked(coursesResource.list.toQuery).mockReturnValue({
      queryKey: ["courses", "list", "inst-1"],
      queryFn: async () => [],
    } as any)

    vi.mocked(classesResource.list.toQuery).mockImplementation(
      (params: any) =>
        ({
          queryKey: ["classes", "list", params],
          queryFn: async () => mockClasses,
        }) as any
    )
  })

  it("defaults to the active term and passes its termId to classes query", async () => {
    render(<ClassesPage />)

    await waitFor(() => {
      expect(classesResource.list.toQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          instituteId: "inst-1",
          termId: "term-active-1",
        })
      )
    })
  })

  it("uses searchParams termId when provided in the URL", async () => {
    state.searchParams = new URLSearchParams("termId=custom-term-id")

    render(<ClassesPage />)

    await waitFor(() => {
      expect(classesResource.list.toQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          instituteId: "inst-1",
          termId: "custom-term-id",
        })
      )
    })
  })

  it("queries with undefined termId when user changes filter to all terms", async () => {
    state.searchParams = new URLSearchParams("termId=all")

    render(<ClassesPage />)

    await waitFor(() => {
      expect(classesResource.list.toQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          instituteId: "inst-1",
          termId: undefined,
        })
      )
    })
  })
})
