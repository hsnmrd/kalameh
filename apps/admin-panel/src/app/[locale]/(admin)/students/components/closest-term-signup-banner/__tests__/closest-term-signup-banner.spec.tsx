import * as React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ClosestTermSignupBanner } from "../index"
import type { TermDto } from "@workspace/types"

vi.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) => {
      if (key === "registeringTitle")
        return `ثبت‌نام ترم ${values?.termTitle} فعال است`
      if (key === "registeringSubtitle")
        return `فراگیران جدید در ترم ${values?.termTitle} قرار می‌گیرند (${values?.days} روز باقی‌مانده)`
      if (key === "wishlistTitle") return `مهلت ثبت‌نام سپری شده است`
      if (key === "wishlistSubtitle")
        return `فراگیران در لیست انتظار ترم ${values?.nextTermTitle} ذخیره می‌شوند`
      if (key === "badgeRegistering") return "ثبت‌نام فعال"
      if (key === "badgeWishlist") return "لیست انتظار ترم بعد"
      if (key === "viewWishlist") return "مشاهده لیست انتظار"
      if (key === "registerAction") return "ثبت‌نام"
      if (key === "expandDetails") return "مشاهده توضیحات"
      if (key === "collapseDetails") return "بستن توضیحات"
      return key
    },
}))

describe("ClosestTermSignupBanner Component", () => {
  it("renders nothing when terms list is empty", () => {
    const { container } = render(<ClosestTermSignupBanner terms={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders registering banner when an active term has registration open", () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 3) // 3 days in future
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 45)

    const term: TermDto = {
      id: "term-1",
      title: "پاییز ۱۴۰۵",
      startDate: futureDate.toISOString(),
      endDate: endDate.toISOString(),
      isActive: true,
      operatingPhaseId: "phase-1",
      operatingPhase: {
        id: "phase-1",
        instituteId: "inst-1",
        title: "عادی",
        startTime: "08:00",
        endTime: "20:00",
        slotDurationMinutes: 90,
        daysOfWeek: ["SATURDAY", "MONDAY"],
        isActive: true,
      },
    }

    render(<ClosestTermSignupBanner terms={[term]} />)

    expect(
      screen.getByText(/ثبت‌نام ترم پاییز ۱۴۰۵ فعال است/i)
    ).toBeInTheDocument()
    expect(screen.getByText("ثبت‌نام فعال")).toBeInTheDocument()
  })

  it("renders wishlist banner when registration has passed", () => {
    const pastStart = new Date()
    pastStart.setDate(pastStart.getDate() - 20) // 20 days ago (reg closed)
    const pastEnd = new Date()
    pastEnd.setDate(pastEnd.getDate() + 15)

    const nextStart = new Date()
    nextStart.setDate(nextStart.getDate() + 25)
    const nextEnd = new Date()
    nextEnd.setDate(nextEnd.getDate() + 70)

    const currentTerm: TermDto = {
      id: "term-curr",
      title: "تابستان ۱۴۰۵",
      startDate: pastStart.toISOString(),
      endDate: pastEnd.toISOString(),
      isActive: true,
      operatingPhaseId: "phase-1",
      operatingPhase: {
        id: "phase-1",
        instituteId: "inst-1",
        title: "عادی",
        startTime: "08:00",
        endTime: "20:00",
        slotDurationMinutes: 90,
        daysOfWeek: ["SATURDAY", "MONDAY"],
        isActive: true,
      },
    }

    const nextTerm: TermDto = {
      id: "term-next",
      title: "زمستان ۱۴۰۵",
      startDate: nextStart.toISOString(),
      endDate: nextEnd.toISOString(),
      isActive: true,
      operatingPhaseId: "phase-1",
      operatingPhase: {
        id: "phase-1",
        instituteId: "inst-1",
        title: "عادی",
        startTime: "08:00",
        endTime: "20:00",
        slotDurationMinutes: 90,
        daysOfWeek: ["SATURDAY", "MONDAY"],
        isActive: true,
      },
    }

    render(<ClosestTermSignupBanner terms={[currentTerm, nextTerm]} />)

    expect(screen.getByText(/مهلت ثبت‌نام سپری شده است/i)).toBeInTheDocument()
    expect(screen.getByText("لیست انتظار ترم بعد")).toBeInTheDocument()
  })

  it("starts collapsed by default on mobile and toggles accordion when chevron is clicked", () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 45)

    const term: TermDto = {
      id: "term-collapsible",
      title: "مهر ۱۴۰۵",
      startDate: futureDate.toISOString(),
      endDate: endDate.toISOString(),
      isActive: true,
      operatingPhaseId: "phase-1",
    }

    const { container } = render(<ClosestTermSignupBanner terms={[term]} />)

    // Collapsible starts closed by default
    const collapsible = container.querySelector("[data-closed]")
    expect(collapsible).toBeInTheDocument()

    // Toggle button exists with aria-label
    const toggleButton = screen.getByRole("button", {
      name: /مشاهده توضیحات/i,
    })
    expect(toggleButton).toBeInTheDocument()
    expect(toggleButton).toHaveAttribute("aria-expanded", "false")

    // Clicking toggle button expands accordion
    fireEvent.click(toggleButton)
    expect(toggleButton).toHaveAttribute("aria-expanded", "true")
    expect(container.querySelector("[data-open]")).toBeInTheDocument()

    // Clicking again collapses accordion
    fireEvent.click(toggleButton)
    expect(toggleButton).toHaveAttribute("aria-expanded", "false")
    expect(container.querySelector("[data-closed]")).toBeInTheDocument()
  })

  it("supports defaultOpen prop to start expanded", () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 45)

    const term: TermDto = {
      id: "term-open",
      title: "آبان ۱۴۰۵",
      startDate: futureDate.toISOString(),
      endDate: endDate.toISOString(),
      isActive: true,
      operatingPhaseId: "phase-1",
    }

    const { container } = render(
      <ClosestTermSignupBanner terms={[term]} defaultOpen={true} />
    )

    expect(container.querySelector("[data-open]")).toBeInTheDocument()
  })
})
