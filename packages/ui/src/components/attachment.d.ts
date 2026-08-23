import * as React from "react"
export interface AttachmentProps {
  value?: File | string | null
  onChange?: (file: File | null) => void
  accept?: string
  maxSizeMb?: number
  disabled?: boolean
  className?: string
  placeholder?: string
  description?: string
  removeLabel?: string
}
export declare function Attachment({
  value,
  onChange,
  accept,
  maxSizeMb,
  disabled,
  className,
  placeholder,
  description,
  removeLabel,
}: AttachmentProps): React.JSX.Element
//# sourceMappingURL=attachment.d.ts.map
