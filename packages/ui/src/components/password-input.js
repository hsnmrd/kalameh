"use client"
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
const PasswordInput = React.forwardRef(
  ({ className, variant = "auth", ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    return _jsxs("div", {
      className: "relative w-full",
      children: [
        _jsx("input", {
          type: showPassword ? "text" : "password",
          className: cn(
            "flex w-full border bg-transparent px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            variant === "default" &&
              "h-9 rounded-md border-input pr-10 focus-visible:ring-1 focus-visible:ring-ring",
            variant === "auth" &&
              "h-14 rounded-2xl border-border bg-background pr-12 pl-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-2 focus:border-ring focus:ring-0",
            className
          ),
          ref: ref,
          ...props,
        }),
        _jsx(Button, {
          type: "button",
          variant: "ghost",
          size: "icon-sm",
          onClick: () => setShowPassword((prev) => !prev),
          className:
            "absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:bg-transparent hover:text-foreground focus-visible:ring-0",
          tabIndex: -1,
          "aria-label": showPassword ? "Hide password" : "Show password",
          children: showPassword
            ? _jsx(EyeOff, { className: "size-5" })
            : _jsx(Eye, { className: "size-5" }),
        }),
      ],
    })
  }
)
PasswordInput.displayName = "PasswordInput"
export { PasswordInput }
