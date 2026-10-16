import * as React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { DataPagination } from "@workspace/ui/components/pagination"
import { DataTable } from "@workspace/ui/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"

describe("DataPagination Component", () => {
  it("renders page info and navigation buttons correctly", () => {
    const onPageChange = vi.fn()
    const onPageSizeChange = vi.fn()

    render(
      <DataPagination
        pageIndex={0}
        pageSize={10}
        totalItems={25}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        locale="en"
      />
    )

    // Total range in English
    expect(screen.getByText(/showing/i)).toBeInTheDocument()
    expect(screen.getAllByText("1").length).toBeGreaterThan(0)
    expect(screen.getAllByText("10").length).toBeGreaterThan(0)
    expect(screen.getByText("25")).toBeInTheDocument()

    // Next page button
    const nextBtn = screen.getByRole("button", { name: "Next" })
    expect(nextBtn).toBeEnabled()
    fireEvent.click(nextBtn)
    expect(onPageChange).toHaveBeenCalledWith(1)

    // Previous button should be disabled on first page
    const prevBtn = screen.getByRole("button", { name: "Previous" })
    expect(prevBtn).toBeDisabled()
  })

  it("disables next button on the last page", () => {
    const onPageChange = vi.fn()

    render(
      <DataPagination
        pageIndex={2} // page 3 of 3 (total 25, pageSize 10)
        pageSize={10}
        totalItems={25}
        onPageChange={onPageChange}
        locale="en"
      />
    )

    const nextBtn = screen.getByRole("button", { name: "Next" })
    expect(nextBtn).toBeDisabled()

    const prevBtn = screen.getByRole("button", { name: "Previous" })
    expect(prevBtn).toBeEnabled()
    fireEvent.click(prevBtn)
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it("renders compact mode for mobile viewports", () => {
    const onPageChange = vi.fn()

    render(
      <DataPagination
        pageIndex={0}
        pageSize={10}
        totalItems={30}
        onPageChange={onPageChange}
        compact
        locale="en"
      />
    )

    expect(screen.getByText("1 / 3")).toBeInTheDocument()
    const nextBtn = screen.getByRole("button", { name: "Next" })
    fireEvent.click(nextBtn)
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it("renders Persian numerals and Persian labels in fa locale", () => {
    render(
      <DataPagination
        pageIndex={0}
        pageSize={10}
        totalItems={100}
        onPageChange={vi.fn()}
        locale="fa"
      />
    )

    expect(screen.getByText(/نمایش/)).toBeInTheDocument()
    expect(screen.getByText(/از/)).toBeInTheDocument()
    expect(screen.getByText(/مورد/)).toBeInTheDocument()
  })
})

describe("DataTable with Pagination", () => {
  interface TestRow {
    id: string
    title: string
  }

  const columns: ColumnDef<TestRow>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span>{row.original.title}</span>,
    },
  ]

  const sampleData: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
    id: `row-${i + 1}`,
    title: `Item ${i + 1}`,
  }))

  it("paginates rows and displays only pageSize rows on page 1", () => {
    render(
      <DataTable
        columns={columns}
        data={sampleData}
        pagination={{ pageSize: 10 }}
        locale="en"
      />
    )

    // Items 1 through 10 should be in the document
    expect(screen.getByText("Item 1")).toBeInTheDocument()
    expect(screen.getByText("Item 10")).toBeInTheDocument()
    // Item 11 should not be visible on page 1
    expect(screen.queryByText("Item 11")).not.toBeInTheDocument()

    // Click next page
    const nextBtn = screen.getByRole("button", { name: "Next" })
    fireEvent.click(nextBtn)

    // Now Item 11 through 20 should be visible
    expect(screen.getByText("Item 11")).toBeInTheDocument()
    expect(screen.getByText("Item 20")).toBeInTheDocument()
    expect(screen.queryByText("Item 1")).not.toBeInTheDocument()
  })

  it("does not render pagination bar when data is empty", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        pagination={{ pageSize: 10 }}
        locale="en"
      />
    )

    expect(
      screen.queryByRole("navigation", { name: "pagination" })
    ).not.toBeInTheDocument()
    expect(screen.queryByText("Showing")).not.toBeInTheDocument()
  })
})
