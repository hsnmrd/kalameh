import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { LogOut, Settings, UserRound } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

const meta = {
  title: "Navigation/Dropdown Menu",
  component: DropdownMenu,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const ProfileActions: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Open profile menu
      </DropdownMenuTrigger>
      <DropdownMenuPopup drawerTitle="Profile actions">
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Account</DropdownMenuGroupLabel>
          <DropdownMenuItem>
            <UserRound data-icon="inline-start" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings data-icon="inline-start" /> Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">
            <LogOut data-icon="inline-start" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuPopup>
    </DropdownMenu>
  ),
}

export const MobileDrawer: Story = {
  ...ProfileActions,
  parameters: { viewport: { defaultViewport: "mobile1" } },
}
