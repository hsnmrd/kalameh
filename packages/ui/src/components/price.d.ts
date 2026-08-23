import * as React from "react"
import { formatCurrency } from "@workspace/ui/lib/utils"
export interface PriceProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | string | null | undefined
  locale?: string
  showUnit?: boolean
  unit?: string
  unitClassName?: string
}
export { formatCurrency }
/**
 * Accessible, standardized price / currency presentation component.
 */
export declare function Price({
  amount,
  locale,
  showUnit,
  unit,
  className,
  unitClassName,
  ...props
}: PriceProps): React.JSX.Element
//# sourceMappingURL=price.d.ts.map
