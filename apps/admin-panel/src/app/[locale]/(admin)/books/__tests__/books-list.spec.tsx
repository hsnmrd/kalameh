import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@/test/test-utils"
import { BooksList } from "../components/books-list"
import type { BookDto } from "@workspace/types"

describe("BooksList Component", () => {
  const mockBooks: BookDto[] = [
    {
      id: "book-1",
      instituteId: "inst-1",
      title: "Advanced Grammar in Use",
      author: "Martin Hewings",
      publisher: "Cambridge University Press",
      description: "Grammar reference",
      coverUrl: null,
      isActive: true,
      coursesCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it("renders publisher and does NOT render writer in mobile list item", () => {
    render(
      <BooksList
        books={mockBooks}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onGenerateCourses={vi.fn()}
        onAdd={vi.fn()}
      />
    )

    expect(screen.getByText("Advanced Grammar in Use")).toBeInTheDocument()
    expect(screen.getByText("Cambridge University Press")).toBeInTheDocument()
    expect(screen.queryByText("Martin Hewings")).not.toBeInTheDocument()
  })

  it("renders empty state when books array is empty", () => {
    render(
      <BooksList
        books={[]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onGenerateCourses={vi.fn()}
        onAdd={vi.fn()}
      />
    )

    expect(screen.getByText("کتابی یافت نشد")).toBeInTheDocument()
  })
})
