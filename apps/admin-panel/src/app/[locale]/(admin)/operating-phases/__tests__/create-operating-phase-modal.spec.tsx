import { describe, it, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { CreateOperatingPhaseModal } from "../components/create-operating-phase-modal"
import { operatingPhasesResource } from "@/lib/api"

describe("CreateOperatingPhaseModal Component", () => {
  it("renders modal with form inputs and opens review step on submit", async () => {
    render(<CreateOperatingPhaseModal open={true} onClose={vi.fn()} />)

    expect(screen.getByText("افزودن فاز زمانی")).toBeInTheDocument()
    expect(screen.getByLabelText(/عنوان فاز/i)).toBeInTheDocument()

    // Form starts in 'form' step, so preview slots are not shown yet
    expect(screen.queryByText(/۴ زنگ کامل|4 زنگ کامل/i)).not.toBeInTheDocument()

    // Enter a title
    const titleInput = screen.getByLabelText(/عنوان فاز/i)
    fireEvent.change(titleInput, { target: { value: "سال تحصیلی" } })

    // Select a month since none are selected by default
    const mehrBtn = screen.getByRole("button", { name: /مهر/i })
    fireEvent.click(mehrBtn)

    // Click submit to transition to review
    const submitBtn = screen.getByText(/ثبت فاز زمانی/i)
    fireEvent.click(submitBtn)

    // Now in review step
    await waitFor(() => {
      expect(
        screen.getByText(/پیش‌نمایش و تایید زنگ‌های آموزشی/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/۴ زنگ کامل|4 زنگ کامل/i)).toBeInTheDocument()
      expect(screen.getByText(/ویرایش مجدد/i)).toBeInTheDocument()
      expect(screen.getByText(/تایید و ثبت نهایی/i)).toBeInTheDocument()
    })
  })

  it("shows remainder warning immediately in initial form modal when time changes, and persists in review step", async () => {
    render(<CreateOperatingPhaseModal open={true} onClose={vi.fn()} />)

    // Initially with 15:00 to 21:00 (360m / 90m = 4 full slots, 0 remainder) -> no warning
    expect(screen.queryByText(/زمان مازاد/i)).not.toBeInTheDocument()

    const titleInput = screen.getByLabelText(/عنوان فاز/i)
    fireEvent.change(titleInput, { target: { value: "فاز آزمایشی" } })

    // Select a month
    const mehrBtn = screen.getByRole("button", { name: /مهر/i })
    fireEvent.click(mehrBtn)

    const endTimeInput = screen.getByLabelText(/ساعت پایان شیفت/i)
    fireEvent.change(endTimeInput, { target: { value: "21:15" } })

    // 15:00 to 21:15 with 90m duration -> 15 mins remainder warning immediately in form step!
    await waitFor(() => {
      expect(screen.getByText(/15 دقیقه زمان مازاد/i)).toBeInTheDocument()
    })

    // Submit form to review step
    const submitBtn = screen.getByText(/ثبت فاز زمانی/i)
    fireEvent.click(submitBtn)

    // Warning is ALSO present in the review modal
    await waitFor(() => {
      expect(
        screen.getByText(/پیش‌نمایش و تایید زنگ‌های آموزشی/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/15 دقیقه زمان مازاد/i)).toBeInTheDocument()
    })
  })

  it("toggles break window and recalculates shifts accordingly in review step", async () => {
    render(<CreateOperatingPhaseModal open={true} onClose={vi.fn()} />)

    const titleInput = screen.getByLabelText(/عنوان فاز/i)
    fireEvent.change(titleInput, { target: { value: "فاز دو شیفت" } })

    // Select a month
    const mehrBtn = screen.getByRole("button", { name: /مهر/i })
    fireEvent.click(mehrBtn)

    const breakCheckbox = screen.getByRole("checkbox", {
      name: /تعریف بازه استراحت و ناهار/i,
    })
    fireEvent.click(breakCheckbox)

    // Break inputs appear with suggestion
    await waitFor(() => {
      expect(screen.getByLabelText(/ساعت شروع استراحت/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/ساعت پایان استراحت/i)).toBeInTheDocument()
      expect(screen.getByText(/پیشنهاد میان‌شیفت/i)).toBeInTheDocument()
    })

    // Change start to 08:30 and end to 20:30
    const startInput = screen.getByLabelText(/ساعت شروع شیفت/i)
    const endInput = screen.getByLabelText(/ساعت پایان شیفت/i)
    fireEvent.change(startInput, { target: { value: "08:30" } })
    fireEvent.change(endInput, { target: { value: "20:30" } })

    // Apply the updated suggested break (13:00 to 14:00)
    const applyBtn = screen.getByText(/اعمال بازه پیشنهادی/i)
    expect(applyBtn.className).toContain("bg-success")
    fireEvent.click(applyBtn)

    // Submit form to review step
    const submitBtn = screen.getByText(/ثبت فاز زمانی/i)
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/7 زنگ کامل|۷ زنگ کامل/i)).toBeInTheDocument()
      expect(screen.getAllByText(/شیفت اول/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/شیفت دوم/i).length).toBeGreaterThan(0)
    })
  })

  it("automatically suggests mid-shift break capped at 1 hour based on shift hours", async () => {
    render(<CreateOperatingPhaseModal open={true} onClose={vi.fn()} />)

    // Set shift to 08:30 - 20:30
    const startInput = screen.getByLabelText(/ساعت شروع شیفت/i)
    const endInput = screen.getByLabelText(/ساعت پایان شیفت/i)
    fireEvent.change(startInput, { target: { value: "08:30" } })
    fireEvent.change(endInput, { target: { value: "20:30" } })

    // Enable break
    const breakCheckbox = screen.getByRole("checkbox", {
      name: /تعریف بازه استراحت و ناهار/i,
    })
    fireEvent.click(breakCheckbox)

    // Verify auto-populated with suggested values (13:00 to 14:00, 60 minutes)
    await waitFor(() => {
      const breakStartInput = screen.getByLabelText(/ساعت شروع استراحت/i)
      const breakEndInput = screen.getByLabelText(/ساعت پایان استراحت/i)
      expect(breakStartInput).toHaveValue("13:00")
      expect(breakEndInput).toHaveValue("14:00")
      expect(
        screen.getByText(/پیشنهاد میان‌شیفت: 13:00 تا 14:00 \(60 دقیقه\)/i)
      ).toBeInTheDocument()
    })
  })

  it("allows returning to form from review via 'ویرایش مجدد' with values preserved", async () => {
    render(<CreateOperatingPhaseModal open={true} onClose={vi.fn()} />)

    const titleInput = screen.getByLabelText(/عنوان فاز/i)
    fireEvent.change(titleInput, { target: { value: "فاز پاییز" } })

    // Select a month
    const mehrBtn = screen.getByRole("button", { name: /مهر/i })
    fireEvent.click(mehrBtn)

    const submitBtn = screen.getByText(/ثبت فاز زمانی/i)
    fireEvent.click(submitBtn)

    // In review step
    await waitFor(() => {
      expect(screen.getByText(/ویرایش مجدد/i)).toBeInTheDocument()
    })

    // Click 'ویرایش مجدد'
    const editAgainBtn = screen.getByText(/ویرایش مجدد/i)
    fireEvent.click(editAgainBtn)

    // Back in form step with value intact
    await waitFor(() => {
      expect(screen.getByLabelText(/عنوان فاز/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue("فاز پاییز")).toBeInTheDocument()
    })
  })

  it("toggles break window by clicking the header row without affecting interior inputs", async () => {
    render(<CreateOperatingPhaseModal open={true} onClose={vi.fn()} />)

    const labelElement = screen.getByText(/تعریف بازه استراحت و ناهار/i)
    const headerRow = labelElement.closest("div")!
    expect(headerRow).toBeInTheDocument()

    // Initially closed
    expect(
      screen.queryByLabelText(/ساعت شروع استراحت/i)
    ).not.toBeInTheDocument()

    // Click on the header row (outside checkbox) to toggle open
    fireEvent.click(headerRow)

    await waitFor(() => {
      expect(screen.getByLabelText(/ساعت شروع استراحت/i)).toBeInTheDocument()
    })

    // Clicking inside the break input does NOT close the section
    const breakStartInput = screen.getByLabelText(/ساعت شروع استراحت/i)
    fireEvent.click(breakStartInput)
    expect(screen.getByLabelText(/ساعت شروع استراحت/i)).toBeInTheDocument()

    // Click header row again to toggle closed
    fireEvent.click(headerRow)

    await waitFor(() => {
      expect(
        screen.queryByLabelText(/ساعت شروع استراحت/i)
      ).not.toBeInTheDocument()
    })
  })

  it("clears all selected months when 'پاک کردن همه' is clicked, shows error state, and clears error when a month is chosen", async () => {
    render(<CreateOperatingPhaseModal open={true} onClose={vi.fn()} />)

    const clearBtn = screen.getByRole("button", { name: /پاک کردن همه/i })
    expect(clearBtn).toBeInTheDocument()
    // Disabled initially because months array is empty by default
    expect(clearBtn).toBeDisabled()

    // Select a month (e.g. مهر)
    const mehrMonthBtn = screen.getByRole("button", { name: /مهر/i })
    fireEvent.click(mehrMonthBtn)
    expect(clearBtn).not.toBeDisabled()

    // Click clear button
    fireEvent.click(clearBtn)

    await waitFor(() => {
      // The button should now be disabled because months array is empty
      expect(clearBtn).toBeDisabled()
      // Month buttons show error state immediately upon clearing
      expect(mehrMonthBtn).toHaveAttribute("aria-invalid", "true")
      expect(mehrMonthBtn.className).toContain("text-destructive")
    })

    // Click on a month (e.g. مهر) to select it again
    fireEvent.click(mehrMonthBtn)

    await waitFor(() => {
      // Error styling clears immediately when month is chosen
      expect(mehrMonthBtn).not.toHaveAttribute("aria-invalid")
      expect(mehrMonthBtn.className).not.toContain("text-destructive")
      // The clear button should become enabled again
      expect(clearBtn).not.toBeDisabled()
    })
  })

  it("highlights month buttons with error styling and prevents showing error text when months are empty on submit", async () => {
    render(<CreateOperatingPhaseModal open={true} onClose={vi.fn()} />)

    // Enter title with months empty by default
    const titleInput = screen.getByLabelText(/عنوان فاز/i)
    fireEvent.change(titleInput, { target: { value: "فاز بدون ماه" } })

    // Submit form
    const submitBtn = screen.getByText(/ثبت فاز زمانی/i)
    fireEvent.click(submitBtn)

    await waitFor(() => {
      // The error sentence MUST NOT be displayed
      expect(
        screen.queryByText(/حداقل باید یک ماه را انتخاب کنید/i)
      ).not.toBeInTheDocument()

      // The month buttons must receive error styling (aria-invalid)
      const mehrBtn = screen.getByRole("button", { name: /مهر/i })
      expect(mehrBtn).toHaveAttribute("aria-invalid", "true")
      expect(mehrBtn.className).toContain("text-destructive")
    })

    // Now select a month
    const mehrBtn = screen.getByRole("button", { name: /مهر/i })
    fireEvent.click(mehrBtn)

    await waitFor(() => {
      // Error styling clears once a month is selected
      expect(mehrBtn).not.toHaveAttribute("aria-invalid")
      expect(mehrBtn.className).not.toContain("text-destructive")
    })
  })

  it("calls onClose when cancel button is clicked", () => {
    const handleClose = vi.fn()
    render(<CreateOperatingPhaseModal open={true} onClose={handleClose} />)

    const cancelBtn = screen.getByText(/انصراف/i)
    fireEvent.click(cancelBtn)

    expect(handleClose).toHaveBeenCalled()
  })

  it("renders Counter component for session duration and steps by 5 minutes", async () => {
    render(<CreateOperatingPhaseModal open={true} onClose={vi.fn()} />)

    const incrementBtn = screen.getByRole("button", { name: "افزایش" })
    const decrementBtn = screen.getByRole("button", { name: "کاهش" })

    expect(incrementBtn).toBeInTheDocument()
    expect(decrementBtn).toBeInTheDocument()

    // Default duration is 90
    // Click increment -> should become 95 (step is 5)
    fireEvent.click(incrementBtn)

    await waitFor(() => {
      // With 15:00 to 21:00 (360m) and 95m slot duration:
      // 3 full slots (285m) + 75m remainder -> remainder warning appears!
      expect(screen.getByText(/75 دقیقه زمان مازاد/i)).toBeInTheDocument()
    })
  })
})
