import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Badge } from "@workspace/ui/components/badge"
import { Price } from "@workspace/ui/components/price"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

const meta = {
  title: "Data/Table",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const CoursePayments: Story = {
  render: () => (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableCaption>Recent course payments</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Roya Ahmadi</TableCell>
            <TableCell>Advanced English</TableCell>
            <TableCell>
              <Badge variant="success">Paid</Badge>
            </TableCell>
            <TableCell>
              <Price amount={2400000} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Arman Karimi</TableCell>
            <TableCell>IELTS Preparation</TableCell>
            <TableCell>
              <Badge variant="warning">Pending</Badge>
            </TableCell>
            <TableCell>
              <Price amount={3100000} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
}
