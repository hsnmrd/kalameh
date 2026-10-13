import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { formatNumber } from "@workspace/ui/lib/utils"
import { InstitutesTable } from "../components/institutes-table"
import type { InstituteWithStats } from "@workspace/types"
import * as stores from "@/lib/stores"

const mockPush = vi.fn()
vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useIsRtl: () => true,
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe("InstitutesTable Component", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mockPush.mockReset()
  })

  const mockInstitutes: InstituteWithStats[] = [
    {
      id: "inst-1",
      name: "آموزشگاه تهران",
      subdomain: "tehran",
      isActive: true,
      logoUrl: null,
      primaryColor: "#10b981",
      address: "تهران، خیابان آزادی",
      phones: ["02166554433"],
      classesCount: 12,
      usersCount: 85,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "inst-2",
      name: "آموزشگاه اصفهان",
      subdomain: "esfahan",
      isActive: false,
      logoUrl: null,
      primaryColor: null,
      address: null,
      phones: [],
      classesCount: 0,
      usersCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it("should render loading spinner when isLoading is true", () => {
    const { container } = render(
      <InstitutesTable
        institutes={undefined}
        isLoading={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
  })

  it("should render empty state message when institutes array is empty", () => {
    render(
      <InstitutesTable
        institutes={[]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText("هیچ آموزشگاهی ثبت نشده است.")).toBeInTheDocument()
  })

  it("should render institute row with name, subdomain, phones, counts and status badge", () => {
    render(
      <InstitutesTable
        institutes={mockInstitutes}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText("آموزشگاه تهران")).toBeInTheDocument()
    expect(screen.getByText("tehran.kalameh.ir")).toBeInTheDocument()
    expect(screen.getByText("02166554433")).toBeInTheDocument()
    expect(screen.getByText(formatNumber(12, "fa"))).toBeInTheDocument()
    expect(screen.getByText(formatNumber(85, "fa"))).toBeInTheDocument()
    expect(screen.getByText("فعال")).toBeInTheDocument()

    expect(screen.getByText("آموزشگاه اصفهان")).toBeInTheDocument()
    expect(screen.getByText("esfahan.kalameh.ir")).toBeInTheDocument()
    expect(screen.getByText("غیرفعال")).toBeInTheDocument()
  })

  it("should trigger onEdit when edit action button is clicked", () => {
    const handleEdit = vi.fn()
    render(
      <InstitutesTable
        institutes={mockInstitutes}
        isLoading={false}
        onEdit={handleEdit}
        onDelete={vi.fn()}
      />
    )

    const editBtns = screen.getAllByRole("button", { name: "ویرایش" })
    fireEvent.click(editBtns[0])
    expect(handleEdit).toHaveBeenCalledWith(mockInstitutes[0])
  })

  it("should trigger onDelete when delete action button is clicked", () => {
    const handleDelete = vi.fn()
    render(
      <InstitutesTable
        institutes={mockInstitutes}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={handleDelete}
      />
    )

    const deleteBtns = screen.getAllByRole("button", { name: "حذف آموزشگاه" })
    fireEvent.click(deleteBtns[0])
    expect(handleDelete).toHaveBeenCalledWith(mockInstitutes[0])
  })

  it("should select institute and navigate to overview when manage button is clicked", () => {
    const selectInstitute = vi.fn()
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstitute: null,
      activeInstituteId: undefined,
      isSuperAdminManaging: false,
      institutes: [],
      isLoadingInstitutes: false,
      selectInstitute,
      clearActiveInstitute: vi.fn(),
      setActiveInstitute: vi.fn(),
    })

    render(
      <InstitutesTable
        institutes={mockInstitutes}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    const manageBtns = screen.getAllByRole("button", { name: "مدیریت" })
    fireEvent.click(manageBtns[0])

    expect(selectInstitute).toHaveBeenCalledWith(mockInstitutes[0])
    expect(mockPush).toHaveBeenCalledWith("/overview")
  })

  it("should display currently managing badge and disabled button for the active institute", () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstitute: mockInstitutes[0],
      activeInstituteId: mockInstitutes[0].id,
      isSuperAdminManaging: true,
      institutes: [],
      isLoadingInstitutes: false,
      selectInstitute: vi.fn(),
      clearActiveInstitute: vi.fn(),
      setActiveInstitute: vi.fn(),
    })

    render(
      <InstitutesTable
        institutes={mockInstitutes}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(
      screen.getAllByText("در حال مدیریت این آموزشگاه").length
    ).toBeGreaterThanOrEqual(1)
  })
})
