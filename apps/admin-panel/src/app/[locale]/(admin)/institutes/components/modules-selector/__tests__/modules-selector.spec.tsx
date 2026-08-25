import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../../../test/test-utils"
import { ModulesSelector } from "../index"
import { APP_MODULES } from "@workspace/types"

describe("ModulesSelector Component", () => {
  it("should render all plan presets and modules", () => {
    const handleChange = vi.fn()
    render(
      <ModulesSelector
        value={[APP_MODULES.USERS_STAFF, APP_MODULES.STUDENTS]}
        onChange={handleChange}
      />
    )

    expect(screen.getByText("پایه")).toBeInTheDocument()
    expect(screen.getByText("پیشرفته")).toBeInTheDocument()
    expect(screen.getByText("سازمانی (کامل)")).toBeInTheDocument()
    expect(screen.getByText("کاربران و پرسنل")).toBeInTheDocument()
    expect(screen.getByText("پرونده فراگیران")).toBeInTheDocument()
    expect(screen.getByText("حسابداری و امور مالی")).toBeInTheDocument()
  })

  it("should toggle a module when clicked", () => {
    const handleChange = vi.fn()
    render(
      <ModulesSelector
        value={[APP_MODULES.USERS_STAFF]}
        onChange={handleChange}
      />
    )

    const financeBtn = screen.getByRole("button", {
      name: /حسابداری و امور مالی/i,
    })
    fireEvent.click(financeBtn)

    expect(handleChange).toHaveBeenCalledWith([
      APP_MODULES.USERS_STAFF,
      APP_MODULES.FINANCE,
    ])
  })

  it("should apply Enterprise preset on click", () => {
    const handleChange = vi.fn()
    render(<ModulesSelector value={[]} onChange={handleChange} />)

    const enterpriseBtn = screen.getByRole("button", {
      name: "سازمانی (کامل)",
    })
    fireEvent.click(enterpriseBtn)

    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        APP_MODULES.USERS_STAFF,
        APP_MODULES.STUDENTS,
        APP_MODULES.CLASSES_COURSES,
        APP_MODULES.GRADES_ASSESSMENTS,
        APP_MODULES.FINANCE,
        APP_MODULES.ATTENDANCE,
        APP_MODULES.SMS_NOTIFICATIONS,
        APP_MODULES.ONLINE_ROOMS,
      ])
    )
  })
})
