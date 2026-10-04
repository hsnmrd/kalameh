import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { ClassesActionButton } from "../components/classes-action-button"

const mockPush = vi.fn()

vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => "/classes",
  useIsRtl: () => true,
}))

describe("ClassesActionButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render the primary Smart Scheduling button linking to /classes/scheduling", () => {
    const onAddClick = vi.fn()

    render(<ClassesActionButton onAddClick={onAddClick} />)

    const schedulingButton = screen.getByRole("link", {
      name: /تقویم آموزشی هوشمند|smart academic calendar|زمان‌بندی هوشمند|smart scheduling/i,
    })
    expect(schedulingButton).toBeInTheDocument()
    expect(schedulingButton).toHaveAttribute("href", "/classes/scheduling")
  })

  it("should render dropdown trigger and reveal options", async () => {
    const onAddClick = vi.fn()

    render(<ClassesActionButton onAddClick={onAddClick} />)

    const trigger = screen.getByRole("button", {
      name: /عملیات|actions/i,
    })
    expect(trigger).toBeInTheDocument()

    fireEvent.click(trigger)

    const manualAddOption = await screen.findByText(
      /تعریف دستی کلاس|add manually/i
    )
    expect(manualAddOption).toBeInTheDocument()

    fireEvent.click(manualAddOption)
    expect(onAddClick).toHaveBeenCalledTimes(1)
  })

  it("should navigate to /classes/scheduling when scheduling option is selected in dropdown", async () => {
    const onAddClick = vi.fn()

    render(<ClassesActionButton onAddClick={onAddClick} />)

    const trigger = screen.getByRole("button", {
      name: /عملیات|actions/i,
    })
    fireEvent.click(trigger)

    // Two elements have this text (the primary button and the dropdown item)
    const options = await screen.findAllByText(
      /تقویم آموزشی هوشمند|smart academic calendar|زمان‌بندی هوشمند|smart scheduling/i
    )
    // The dropdown menu item is the last one
    const dropdownOption = options[options.length - 1]!
    fireEvent.click(dropdownOption)

    expect(mockPush).toHaveBeenCalledWith("/classes/scheduling")
  })

  it("should render single scheduling button without dropdown when onAddClick is omitted", () => {
    render(<ClassesActionButton />)

    const schedulingButton = screen.getByRole("link", {
      name: /تقویم آموزشی هوشمند|smart academic calendar|زمان‌بندی هوشمند|smart scheduling/i,
    })
    expect(schedulingButton).toBeInTheDocument()

    const trigger = screen.queryByRole("button", {
      name: /عملیات|actions/i,
    })
    expect(trigger).not.toBeInTheDocument()
  })
})
