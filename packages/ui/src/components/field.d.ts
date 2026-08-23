import * as React from "react"
export declare function FieldGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element
export declare function Field({
  className,
  "data-invalid": dataInvalid,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  "data-invalid"?: boolean
}): React.JSX.Element
export declare function FieldLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>): React.JSX.Element
export declare function FieldError({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>): React.JSX.Element | null
export declare function FieldDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>): React.JSX.Element
//# sourceMappingURL=field.d.ts.map
