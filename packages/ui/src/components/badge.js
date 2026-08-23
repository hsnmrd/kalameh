import { jsx as _jsx } from "react/jsx-runtime"
import { cva } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive/15 text-destructive",
        outline: "border-border text-foreground",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-600",
        info: "border-sky-500/20 bg-sky-500/10 text-sky-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
function Badge({ className, variant, ...props }) {
  return _jsx("div", {
    className: cn(badgeVariants({ variant }), className),
    ...props,
  })
}
export { Badge, badgeVariants }
