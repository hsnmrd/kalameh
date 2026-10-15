import { describe, it, expect, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { FromBookForm } from "../components/create-group-courses-modal/from-book-form"
import type { BookDto, CourseDto } from "@workspace/types"

const mockBooks: BookDto[] = [
  {
    id: "book-1",
    title: "Advanced Grammar in Use",
    publisher: "Cambridge University Press",
    author: "Martin Hewings",
    isGlobal: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "book-2",
    title: "English Vocabulary in Use",
    publisher: "Cambridge University Press",
    author: "Michael McCarthy",
    isGlobal: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockCourses: CourseDto[] = []

describe("FromBookForm", () => {
  it("renders book title with larger font size", () => {
    render(
      <FromBookForm
        books={mockBooks}
        courses={mockCourses}
        selectedBooks={{}}
        onToggleBook={vi.fn()}
        onUpdateBook={vi.fn()}
      />
    )

    const titleElement = screen.getByText("Advanced Grammar in Use")
    expect(titleElement).toBeInTheDocument()
    expect(titleElement.className).toContain("text-base")
    expect(titleElement.className).toContain("sm:text-lg")
    expect(titleElement.className).toContain("font-semibold")
  })

  it("does NOT display the publisher value", () => {
    render(
      <FromBookForm
        books={mockBooks}
        courses={mockCourses}
        selectedBooks={{}}
        onToggleBook={vi.fn()}
        onUpdateBook={vi.fn()}
      />
    )

    expect(
      screen.queryByText("Cambridge University Press")
    ).not.toBeInTheDocument()
  })

  it("renders items container with divide-y dividers instead of card borders", () => {
    const { container } = render(
      <FromBookForm
        books={mockBooks}
        courses={mockCourses}
        selectedBooks={{}}
        onToggleBook={vi.fn()}
        onUpdateBook={vi.fn()}
      />
    )

    const listContainer = container.querySelector(
      ".divide-y.divide-border\\/60"
    )
    expect(listContainer).toBeInTheDocument()
    expect(listContainer?.children).toHaveLength(2)

    // Items should have divider spacing and no card border classes
    const firstItem = listContainer?.firstElementChild
    expect(firstItem?.className).toContain("py-3.5")
    expect(firstItem?.className).not.toContain("border-primary")
    expect(firstItem?.className).not.toContain("bg-card")
  })

  it("paginates books when count exceeds pageSize and supports navigation", async () => {
    const { fireEvent } = await import("../../../../../test/test-utils")

    render(
      <FromBookForm
        books={mockBooks}
        courses={mockCourses}
        selectedBooks={{}}
        onToggleBook={vi.fn()}
        onUpdateBook={vi.fn()}
        pageSize={1}
      />
    )

    // First page should show first book
    expect(screen.getByText("Advanced Grammar in Use")).toBeInTheDocument()
    expect(
      screen.queryByText("English Vocabulary in Use")
    ).not.toBeInTheDocument()

    // Next page button should be present
    const nextBtn = screen.getByRole("button", { name: "بعدی" })
    expect(nextBtn).toBeInTheDocument()
    fireEvent.click(nextBtn)

    // Second page should now show second book
    expect(screen.getByText("English Vocabulary in Use")).toBeInTheDocument()
    expect(
      screen.queryByText("Advanced Grammar in Use")
    ).not.toBeInTheDocument()
  })
})
