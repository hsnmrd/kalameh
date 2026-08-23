import * as React from "react"
import { type VariantProps } from "class-variance-authority"
declare const spinnerVariants: (
  props?:
    | ({
        size?: "default" | "sm" | "lg" | "xl" | null | undefined
      } & import("class-variance-authority/types").ClassProp)
    | undefined
) => string
export interface SpinnerProps
  extends
    React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {
  className?: string
}
export declare function Spinner({
  size,
  className,
  ...props
}: SpinnerProps): React.JSX.Element
export {}
//# sourceMappingURL=spinner.d.ts.map
