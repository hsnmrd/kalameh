import { type ClassValue } from "clsx"
export declare function cn(...inputs: ClassValue[]): string
/**
 * Converts ASCII digits (0-9) to Persian digits (۰-۹).
 */
export declare function toPersianDigits(
  value: number | string | null | undefined
): string
/**
 * Format a number according to locale (with digit localization and comma thousand grouping).
 */
export declare function formatNumber(
  value: number | string | null | undefined,
  locale?: string
): string
/**
 * Format a number as currency separated with commas and appended with Toman (تومان / Toman).
 */
export declare function formatCurrency(
  amount: number | string | null | undefined,
  locale?: string,
  showUnit?: boolean,
  unit?: string
): string
//# sourceMappingURL=utils.d.ts.map
