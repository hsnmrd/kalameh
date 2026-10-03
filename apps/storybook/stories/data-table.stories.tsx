import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@workspace/ui/components/badge"
import { DataTable } from "@workspace/ui/components/data-table"

interface StudentRow {
  name: string
  course: string
  status: "Active" | "Paused"
}

const columns: ColumnDef<StudentRow>[] = [
  { accessorKey: "name", header: "Student" },
  { accessorKey: "course", header: "Course" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "Active" ? "success" : "secondary"}
      >
        {row.original.status}
      </Badge>
    ),
  },
]

const students: StudentRow[] = [
  { name: "Roya Ahmadi", course: "Advanced English", status: "Active" },
  { name: "Arman Karimi", course: "IELTS Preparation", status: "Paused" },
]

const meta = {
  title: "Data/Data Table",
  parameters: { layout: "padded" },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const WithRows: Story = {
  render: () => <DataTable columns={columns} data={students} />,
}

export const Empty: Story = {
  render: () => (
    <DataTable
      columns={columns}
      data={[]}
      emptyMessage="No students match the current filters."
    />
  ),
}
