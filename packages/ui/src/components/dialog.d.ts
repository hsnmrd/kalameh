import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
declare const Dialog: typeof DialogPrimitive.Root
declare const DialogTrigger: DialogPrimitive.Trigger
declare const DialogPortal: React.ForwardRefExoticComponent<
  Omit<import("@base-ui/react/dialog").DialogPortalProps, "ref"> &
    React.RefAttributes<HTMLDivElement>
>
declare const DialogClose: React.ForwardRefExoticComponent<
  Omit<import("@base-ui/react/dialog").DialogCloseProps, "ref"> &
    React.RefAttributes<HTMLButtonElement>
>
declare function DialogBackdrop({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props): React.JSX.Element
declare function DialogPopup({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props): React.JSX.Element
declare function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element
declare function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element
declare function DialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props): React.JSX.Element
declare function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props): React.JSX.Element
declare function DialogCloseButton({
  className,
  ...props
}: DialogPrimitive.Close.Props): React.JSX.Element
export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogCloseButton,
}
//# sourceMappingURL=dialog.d.ts.map
