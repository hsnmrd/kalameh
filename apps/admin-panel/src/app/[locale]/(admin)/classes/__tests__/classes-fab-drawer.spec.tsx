import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { ClassesFabDrawer } from "../components/classes-fab-drawer"

vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    className,
    onClick,
  }: {
    children: React.ReactNode
    href: string
    className?: string
    onClick?: () => void
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/classes",
  useIsRtl: () => true,
}))

describe("ClassesFabDrawer Component", () => {
  it("should render mobile FAB trigger button", () => {
    const onAddClick = vi.fn()

    render(<ClassesFabDrawer onAddClick={onAddClick} />)

    const fab = screen.getByRole("button", {
      name: /عملیات|actions/i,
    })
    expect(fab).toBeInTheDocument()
  })

  it("should open drawer and render action links and buttons", () => {
    const onAddClick = vi.fn()

    render(<ClassesFabDrawer onAddClick={onAddClick} />)

    const fab = screen.getByRole("button", {
      name: /عملیات|actions/i,
    })
    fireEvent.click(fab)

    const schedulingLink = screen.getByRole("link", {
      name: /تقویم آموزشی هوشمند|smart academic calendar|زمان‌بندی هوشمند|smart scheduling/i,
    })
    expect(schedulingLink).toBeInTheDocument()
    expect(schedulingLink).toHaveAttribute("href", "/classes/scheduling")

    const manualAddButton = screen.getByRole("button", {
      name: /تعریف دستی کلاس|add manually/i,
    })
    expect(manualAddButton).toBeInTheDocument()

    fireEvent.click(manualAddButton)
    expect(onAddClick).toHaveBeenCalledTimes(1)
  })

  it("should render cancel button in drawer footer and close drawer", () => {
    const onAddClick = vi.fn()

    render(<ClassesFabDrawer onAddClick={onAddClick} />)

    const fab = screen.getByRole("button", {
      name: /عملیات|actions/i,
    })
    fireEvent.click(fab)

    const cancelButton = screen.getByRole("button", {
      name: /انصراف|cancel/i,
    })
    expect(cancelButton).toBeInTheDocument()
  })
})
