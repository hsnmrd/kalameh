import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
declare const Select: typeof SelectPrimitive.Root
declare const SelectGroup: React.ForwardRefExoticComponent<
  Omit<import("@base-ui/react/select").SelectGroupProps, "ref"> &
    React.RefAttributes<HTMLDivElement>
>
declare const SelectValue: React.ForwardRefExoticComponent<
  Omit<import("@base-ui/react/select").SelectValueProps, "ref"> &
    React.RefAttributes<HTMLSpanElement>
>
declare function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props): React.JSX.Element
declare function SelectPopup({
  className,
  children,
  ...props
}: SelectPrimitive.Popup.Props): React.JSX.Element
declare function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props): React.JSX.Element
declare function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props): React.JSX.Element
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectPopup,
  SelectPopup as SelectContent,
  SelectItem,
  SelectLabel,
}
//# sourceMappingURL=select.d.ts.map
