import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const spinnerVariants = cva("animate-spin text-current", {
  variants: {
    size: {
      default: "size-5",
      sm: "size-4",
      lg: "size-6",
      xl: "size-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface SpinnerProps
  extends
    React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  className?: string
}

export function Spinner({ size, className, ...props }: SpinnerProps) {
  return (
    <svg
      role="status"
      aria-label="بارگذاری"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(spinnerVariants({ size, className }))}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        className="opacity-20"
        stroke="currentColor"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        className="opacity-90"
        stroke="currentColor"
      />
    </svg>
  )
}
