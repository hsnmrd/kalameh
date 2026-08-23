"use client"

import * as React from "react"
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface AttachmentProps {
  value?: string | null
  onChange?: (dataUrl: string | null, file?: File | null) => void
  accept?: string
  maxSizeMb?: number
  disabled?: boolean
  className?: string
  placeholder?: string
  description?: string
  removeLabel?: string
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
}: AttachmentProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fileName, setFileName] = React.useState<string | null>(null)

  const processFile = (file: File) => {
    setError(null)
    const maxSizeBytes = maxSizeMb * 1024 * 1024

    if (file.size > maxSizeBytes) {
      setError(`File size exceeds limit (${maxSizeMb}MB)`)
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      onChange?.(result, file)
    }
    reader.onerror = () => {
      setError("Failed to read file")
    }
    reader.readAsDataURL(file)
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
    onChange?.(null, null)
  }

  const triggerSelect = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
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

      {value ? (
        <div className="relative flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3 shadow-2xs transition-all">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt={fileName || "Attachment preview"}
                className="size-full object-contain p-1"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {fileName || "Logo / Image"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
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
              disabled={disabled}
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
              : "border-border bg-muted/30 hover:border-border/80 hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50",
            error && "border-destructive bg-destructive/5"
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-2xs transition-transform group-hover:scale-105">
            <ImageIcon className="size-5 text-foreground/70" />
          </div>
          <p className="mt-2 text-xs font-medium text-foreground">
            {placeholder}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
