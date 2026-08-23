import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { BranchesTable } from "../components/branches-table"
import type { BranchWithStats } from "@workspace/types"

describe("BranchesTable Component", () => {
  const mockBranches: BranchWithStats[] = [
    {
      id: "branch-1",
      instituteId: "inst-1",
      name: "شعبه مرکزی",
      address: "تهران، خیابان آزادی",
      phones: ["02166001122"],
      isActive: true,
      classesCount: 6,
      usersCount: 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it("should render loading spinner when isLoading is true", () => {
    const { container } = render(
      <BranchesTable branches={undefined} isLoading={true} onEdit={vi.fn()} />
    )
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
  })

  it("should render empty state message when branches array is empty", () => {
    render(<BranchesTable branches={[]} isLoading={false} onEdit={vi.fn()} />)
    expect(screen.getByText(/هیچ شعبه‌ای/i)).toBeInTheDocument()
  })

  it("should render branch row with name, address, phone and counts", () => {
    render(
      <BranchesTable
        branches={mockBranches}
        isLoading={false}
        onEdit={vi.fn()}
      />
    )
    expect(screen.getByText("شعبه مرکزی")).toBeInTheDocument()
    expect(screen.getByText("تهران، خیابان آزادی")).toBeInTheDocument()
    expect(screen.getByText("02166001122")).toBeInTheDocument()
    expect(screen.getByText("6")).toBeInTheDocument()
    expect(screen.getByText("25")).toBeInTheDocument()
  })

  it("should trigger onEdit when edit button is clicked", () => {
    const handleEdit = vi.fn()
    render(
      <BranchesTable
        branches={mockBranches}
        isLoading={false}
        onEdit={handleEdit}
      />
    )
    const editBtn = screen.getByLabelText(/عملیات|actions/i)
    fireEvent.click(editBtn)
    expect(handleEdit).toHaveBeenCalledWith(mockBranches[0])
  })
})
