import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ChevronRight, GraduationCap } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import {
  MobileList,
  MobileListItem,
  MobileListItemContent,
  MobileListItemIcon,
  MobileListItemTrailing,
} from "@workspace/ui/components/mobile-list"

const meta = {
  title: "Mobile/Mobile List",
  parameters: {
    layout: "padded",
    viewport: { defaultViewport: "mobile1" },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Students: Story = {
  render: () => (
    <MobileList>
      <MobileListItem>
        <MobileListItemIcon>
          <GraduationCap aria-hidden />
        </MobileListItemIcon>
        <MobileListItemContent
          primary="Roya Ahmadi"
          secondary="Advanced English"
        />
        <MobileListItemTrailing>
          <Badge variant="success">Active</Badge>
          <ChevronRight className="text-muted-foreground" aria-hidden />
        </MobileListItemTrailing>
      </MobileListItem>
      <MobileListItem isLast>
        <MobileListItemIcon>
          <GraduationCap aria-hidden />
        </MobileListItemIcon>
        <MobileListItemContent
          primary="Arman Karimi"
          secondary="IELTS Preparation"
        />
        <MobileListItemTrailing>
          <Badge variant="secondary">Paused</Badge>
          <ChevronRight className="text-muted-foreground" aria-hidden />
        </MobileListItemTrailing>
      </MobileListItem>
    </MobileList>
  ),
}
