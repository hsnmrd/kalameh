"use client"
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close
function DialogBackdrop({ className, ...props }) {
  return _jsx(DialogPrimitive.Backdrop, {
    className: cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
      className
    ),
    ...props,
  })
}
function DialogPopup({ className, children, ...props }) {
  return _jsxs(DialogPortal, {
    children: [
      _jsx(DialogBackdrop, {}),
      _jsx("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center p-4",
        children: _jsx(DialogPrimitive.Popup, {
          className: cn(
            "relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl transition-all duration-150 focus:outline-hidden data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          ),
          ...props,
          children: children,
        }),
      }),
    ],
  })
}
function DialogHeader({ className, ...props }) {
  return _jsx("div", {
    className: cn(
      "flex flex-col space-y-1.5 text-center sm:text-start",
      className
    ),
    ...props,
  })
}
function DialogFooter({ className, ...props }) {
  return _jsx("div", {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2",
      className
    ),
    ...props,
  })
}
function DialogTitle({ className, ...props }) {
  return _jsx(DialogPrimitive.Title, {
    className: cn(
      "text-lg leading-none font-semibold tracking-tight text-foreground",
      className
    ),
    ...props,
  })
}
function DialogDescription({ className, ...props }) {
  return _jsx(DialogPrimitive.Description, {
    className: cn("text-sm text-muted-foreground", className),
    ...props,
  })
}
function DialogCloseButton({ className, ...props }) {
  return _jsxs(DialogPrimitive.Close, {
    className: cn(
      "absolute end-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-ring focus:outline-hidden",
      className
    ),
    ...props,
    children: [
      _jsx(X, { className: "size-4" }),
      _jsx("span", { className: "sr-only", children: "Close" }),
    ],
  })
}
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
