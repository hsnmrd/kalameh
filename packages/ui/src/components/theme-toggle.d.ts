import * as React from "react"
import { Button } from "@workspace/ui/components/button"
export interface ThemeToggleProps extends React.ComponentPropsWithoutRef<
  typeof Button
> {
  showLabel?: boolean
  labels?: {
    light?: string
    dark?: string
    system?: string
  }
}
/**
 * Accessible theme switcher component driven purely by CSS variables.
 * Cycles through light, dark, and system modes.
 */
export declare function ThemeToggle({
  className,
  showLabel,
  labels,
  ...props
}: ThemeToggleProps): React.JSX.Element
//# sourceMappingURL=theme-toggle.d.ts.map
