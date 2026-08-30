import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import SettingPage from "../page"

// Mock next-themes
const mockSetTheme = vi.fn()
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
  }),
}))

// Mock routing
const mockReplace = vi.fn()
vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
  }),
  usePathname: () => "/setting",
}))

describe("Admin SettingPage", () => {
  it("should render setting page title and cards", () => {
    render(<SettingPage />)

    expect(
      screen.getByRole("heading", {
        name: /setting\.title|تنظیمات|settings/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/setting\.theme\.title|پوسته و تم/i).length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/setting\.language\.title|زبان سامانه|language/i)
        .length
    ).toBeGreaterThan(0)
  })

  it("should allow changing theme", () => {
    render(<SettingPage />)

    const darkBtn = screen.getByRole("button", {
      name: /dark|تیره|setting\.theme\.dark/i,
    })
    fireEvent.click(darkBtn)

    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })

  it("should allow switching language", () => {
    render(<SettingPage />)

    const enBtn = screen.getByRole("button", {
      name: /en|english|setting\.language\.en/i,
    })
    fireEvent.click(enBtn)

    expect(mockReplace).toHaveBeenCalledWith("/setting", { locale: "en" })
  })
})
