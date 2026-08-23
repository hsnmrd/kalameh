import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { cva } from "class-variance-authority"
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
export function Spinner({ size, className, ...props }) {
  return _jsxs("svg", {
    role: "status",
    "aria-label": "\u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: cn(spinnerVariants({ size, className })),
    ...props,
    children: [
      _jsx("circle", {
        cx: "12",
        cy: "12",
        r: "10",
        className: "opacity-20",
        stroke: "currentColor",
      }),
      _jsx("path", {
        d: "M12 2a10 10 0 0 1 10 10",
        className: "opacity-90",
        stroke: "currentColor",
      }),
    ],
  })
}
