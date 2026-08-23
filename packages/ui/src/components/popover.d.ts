import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
declare const Popover: typeof PopoverPrimitive.Root
declare const PopoverTrigger: PopoverPrimitive.Trigger
declare const PopoverPortal: React.ForwardRefExoticComponent<
  Omit<import("@base-ui/react/popover").PopoverPortalProps, "ref"> &
    React.RefAttributes<HTMLDivElement>
>
declare const PopoverClose: React.ForwardRefExoticComponent<
  Omit<import("@base-ui/react/popover").PopoverCloseProps, "ref"> &
    React.RefAttributes<HTMLButtonElement>
>
declare function PopoverPopup({
  className,
  children,
  sideOffset,
  align,
  ...props
}: PopoverPrimitive.Popup.Props & {
  sideOffset?: number
  align?: "start" | "center" | "end"
}): React.JSX.Element
export {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverClose,
  PopoverPopup,
  PopoverPopup as PopoverContent,
}
//# sourceMappingURL=popover.d.ts.map
