"use client"

import * as React from "react"
import Image from "next/image"
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import {
  ImageCropperDialog,
  type CropShape,
  type ImageFormat,
} from "./image-cropper"

export interface AttachmentCropOptions {
  aspectRatio?: number
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: ImageFormat
  cropShape?: CropShape
  title?: string
  confirmLabel?: string
  cancelLabel?: string
}

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
  crop?: boolean | AttachmentCropOptions
  uploadProgress?: number | null
  uploadProgressLabel?: string
}

export function Attachment({
  value,
  onChange,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  maxSizeMb = 5,
  disabled = false,
  className,
  placeholder = "Upload an image or logo",
  description = "PNG, JPG, WEBP or SVG (Max 5MB)",
  removeLabel = "Remove",
  crop = false,
  uploadProgress,
  uploadProgressLabel,
}: AttachmentProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [hasImageError, setHasImageError] = React.useState(false)
  const [cropFile, setCropFile] = React.useState<File | null>(null)
  const [isCropperOpen, setIsCropperOpen] = React.useState(false)

  const cropOptions = React.useMemo<AttachmentCropOptions | null>(() => {
    if (!crop) return null
    if (typeof crop === "object") {
      return {
        aspectRatio: 1,
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
        format: "image/webp",
        cropShape: "round",
        ...crop,
      }
    }
    return {
      aspectRatio: 1,
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.85,
      format: "image/webp",
      cropShape: "round",
    }
  }, [crop])

  const previewSrc = React.useMemo(() => {
    if (!value) return null
    if (typeof value === "string") return value
    if (typeof window !== "undefined" && value instanceof File) {
      return URL.createObjectURL(value)
    }
    return null
  }, [value])

  React.useEffect(() => {
    setHasImageError(false)
  }, [previewSrc])

  React.useEffect(() => {
    return () => {
      if (
        previewSrc &&
        typeof value !== "string" &&
        typeof window !== "undefined"
      ) {
        URL.revokeObjectURL(previewSrc)
      }
    }
  }, [previewSrc, value])

  const displayName = React.useMemo(() => {
    if (fileName) return fileName
    if (typeof value === "object" && value instanceof File) return value.name
    if (typeof value === "string") {
      const parts = value.split("/")
      return parts[parts.length - 1] || "Image"
    }
    return "Image"
  }, [fileName, value])

  const processFile = (file: File) => {
    setError(null)
    const maxSizeBytes = maxSizeMb * 1024 * 1024

    if (file.size > maxSizeBytes) {
      setError(`File size exceeds limit (${maxSizeMb}MB)`)
      return
    }

    const isImage =
      file.type.startsWith("image/") && file.type !== "image/svg+xml"
    if (cropOptions && isImage) {
      setCropFile(file)
      setIsCropperOpen(true)
      return
    }

    setFileName(file.name)
    onChange?.(file)
  }

  const handleCropComplete = (croppedFile: File) => {
    setFileName(croppedFile.name)
    setIsCropperOpen(false)
    setCropFile(null)
    onChange?.(croppedFile)
  }

  const handleCropCancel = () => {
    setIsCropperOpen(false)
    setCropFile(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFileName(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    onChange?.(null)
  }

  const triggerSelect = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {previewSrc ? (
        <div className="relative flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3 shadow-2xs transition-all">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/60">
              {hasImageError ? (
                <ImageIcon className="size-6 text-muted-foreground" />
              ) : (
                <Image
                  src={previewSrc}
                  alt={displayName || "Attachment preview"}
                  width={48}
                  height={48}
                  className="size-full object-contain p-1"
                  unoptimized
                  onError={() => setHasImageError(true)}
                />
              )}
              {typeof uploadProgress === "number" && uploadProgress >= 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
                  <Spinner className="size-4 text-primary" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {description}
              </p>
              {typeof uploadProgress === "number" && uploadProgress >= 0 && (
                <div
                  className="mt-2 flex flex-col gap-1"
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <span>
                      {uploadProgressLabel ||
                        (typeof document !== "undefined" &&
                        document.documentElement.lang === "fa"
                          ? "در حال بارگذاری..."
                          : "Uploading...")}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-150 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(0, uploadProgress))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                disabled ||
                (typeof uploadProgress === "number" && uploadProgress >= 0)
              }
              onClick={triggerSelect}
              className="h-8 rounded-lg px-3 text-xs"
            >
              <Upload className="me-1 size-3.5" />
              Change
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={
                disabled ||
                (typeof uploadProgress === "number" && uploadProgress >= 0)
              }
              onClick={handleRemove}
              className="size-8 rounded-lg p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={removeLabel}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={triggerSelect}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              triggerSelect()
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
            disabled && "cursor-not-allowed bg-muted/40"
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform group-hover:scale-105">
            <ImageIcon className="size-5" />
          </div>
          <div className="mt-2 flex flex-col gap-0.5">
            <p className="text-xs font-medium text-foreground">{placeholder}</p>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cropOptions && (
        <ImageCropperDialog
          open={isCropperOpen}
          onOpenChange={(open) => {
            setIsCropperOpen(open)
            if (!open) setCropFile(null)
          }}
          imageFile={cropFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={cropOptions.aspectRatio}
          maxWidth={cropOptions.maxWidth}
          maxHeight={cropOptions.maxHeight}
          quality={cropOptions.quality}
          format={cropOptions.format}
          cropShape={cropOptions.cropShape}
          title={cropOptions.title}
          confirmLabel={cropOptions.confirmLabel}
          cancelLabel={cropOptions.cancelLabel}
        />
      )}
    </div>
  )
}
