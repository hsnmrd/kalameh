import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { BooksTable } from "../components/books-table"
import type { BookDto } from "@workspace/types"

describe("BooksTable Component", () => {
  const mockBooks: BookDto[] = [
    {
      id: "book-1",
      instituteId: "inst-1",
      title: "American English File 1",
      author: "Christina Latham-Koenig",
      publisher: "Oxford University Press",
      description: "Elementary course",
      coverUrl: null,
      isActive: true,
      coursesCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "book-2",
      instituteId: "inst-1",
      title: "Touchstone 1",
      author: "Michael McCarthy",
      publisher: "Cambridge",
      description: null,
      coverUrl: null,
      isActive: true,
      coursesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it("should render loading spinner when isLoading is true", () => {
    const { container } = render(
      <BooksTable
        books={[]}
        isLoading={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onGenerateCourses={vi.fn()}
        onAdd={vi.fn()}
      />
    )
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
  })

  it("should render empty state when books array is empty and not loading", () => {
    render(
      <BooksTable
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

  it("should render book titles, author, and publisher in table", () => {
    render(
      <BooksTable
        books={mockBooks}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onGenerateCourses={vi.fn()}
        onAdd={vi.fn()}
      />
    )
    expect(screen.getByText("American English File 1")).toBeInTheDocument()
    expect(screen.getByText("Touchstone 1")).toBeInTheDocument()
    expect(screen.getByText("Christina Latham-Koenig")).toBeInTheDocument()
    expect(screen.getByText("Oxford University Press")).toBeInTheDocument()
  })

  it("should render global badge for books without instituteId", () => {
    const globalBook: BookDto = {
      id: "global-1",
      instituteId: null,
      isGlobal: true,
      title: "English File Beginner",
      author: null,
      publisher: null,
      description: null,
      coverUrl: null,
      isActive: true,
      coursesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    render(
      <BooksTable
        books={[globalBook]}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onGenerateCourses={vi.fn()}
        onAdd={vi.fn()}
      />
    )
    expect(screen.getByText("English File Beginner")).toBeInTheDocument()
    expect(screen.getByText("سراسری")).toBeInTheDocument()
  })
})
