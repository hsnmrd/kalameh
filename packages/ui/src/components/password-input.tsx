"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "auth"
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, variant = "auth", ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative w-full">
        <input
          type={showPassword ? "text" : "password"}
          className={cn(
            "flex w-full border bg-transparent px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            variant === "default" &&
              "h-9 rounded-md border-input pr-10 focus-visible:ring-1 focus-visible:ring-ring",
            variant === "auth" &&
              "h-14 rounded-2xl border-slate-200 pr-12 pl-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-2 focus:border-black focus:ring-0",
            className
          )}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-slate-400 hover:bg-transparent hover:text-slate-600 focus-visible:ring-0"
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="size-5" />
          ) : (
            <Eye className="size-5" />
          )}
        </Button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
