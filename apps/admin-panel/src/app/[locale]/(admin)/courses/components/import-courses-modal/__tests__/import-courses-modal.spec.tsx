import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NextIntlClientProvider } from "next-intl"
import { ImportCoursesModal } from "../index"
import coursesMessages from "@/messages/fa/courses.json"
import commonMessages from "@/messages/fa/common.json"

const messages = {
  courses: coursesMessages,
  common: commonMessages,
}

describe("ImportCoursesModal", () => {
  let queryClient: QueryClient
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  const renderComponent = (open = true) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="fa" messages={messages}>
          <ImportCoursesModal open={open} onClose={mockOnClose} />
        </NextIntlClientProvider>
      </QueryClientProvider>
    )
  }

  it("should render dialog with title, download button, and file dropzone when open", () => {
    renderComponent(true)

    expect(
      screen.getByText(coursesMessages.importModal.title)
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(coursesMessages.importModal.downloadTemplate).length
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByText(coursesMessages.importModal.dragDropText)
    ).toBeInTheDocument()
  })

  it("should not render dialog content when closed", () => {
    renderComponent(false)
    expect(
      screen.queryByText(coursesMessages.importModal.title)
    ).not.toBeInTheDocument()
  })

  it("should select file and show file name", () => {
    renderComponent(true)

    const file = new File(["dummy content"], "courses.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    expect(input).toBeInTheDocument()

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getAllByText(/courses\.xlsx/).length).toBeGreaterThanOrEqual(
      1
    )
  })
})
