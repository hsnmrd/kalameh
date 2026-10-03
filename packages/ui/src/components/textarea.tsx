import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-2xl border border-border bg-background p-4 text-base text-foreground shadow-2xs transition-colors placeholder:font-sans placeholder:text-muted-foreground/35 focus:border-2 focus:border-ring focus:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
