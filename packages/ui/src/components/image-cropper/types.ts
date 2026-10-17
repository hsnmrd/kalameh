export type CropShape = "rect" | "round"
export type ImageFormat = "image/webp" | "image/jpeg" | "image/png"

export interface CropBoxDimensions {
  width: number
  height: number
}

export interface CropOffset {
  x: number
  y: number
}

export interface AspectRatioOption {
  label: string
  value: number
  id?: string
}

export interface ImageCropperOptions {
  aspectRatio?: number // default 1 (1:1)
  aspectRatioOptions?: AspectRatioOption[]
  allowAspectRatioSelection?: boolean
  maxWidth?: number // default 512
  maxHeight?: number // default 512
  quality?: number // default 0.85
  format?: ImageFormat // default "image/webp"
  cropShape?: CropShape // default "round"
  title?: string
  confirmLabel?: string
  cancelLabel?: string
}

export interface ImageCropperDialogProps extends ImageCropperOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageFile?: File | null
  imageSrc?: string | null
  onCropComplete: (file: File) => void
  onCancel?: () => void
  disabled?: boolean
}
