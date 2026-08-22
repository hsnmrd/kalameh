import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "auth"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full border bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          variant === "default" &&
            "h-9 rounded-md border-input focus-visible:ring-1 focus-visible:ring-ring",
          variant === "auth" &&
            "h-14 rounded-2xl border-border bg-background px-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-2 focus:border-ring focus:ring-0",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
