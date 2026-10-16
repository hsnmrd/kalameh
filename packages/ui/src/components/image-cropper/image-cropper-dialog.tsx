"use client"

import * as React from "react"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import { ImageCropperViewport } from "./image-cropper-viewport"
import { ImageCropperControls } from "./image-cropper-controls"
import { cropAndCompressImage } from "./crop-image-helper"
import type {
  CropBoxDimensions,
  CropOffset,
  ImageCropperDialogProps,
} from "./types"

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageFile,
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  maxWidth = 512,
  maxHeight = 512,
  quality = 0.85,
  format = "image/webp",
  cropShape = "round",
  title = "برش و بهینه‌سازی تصویر",
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  disabled = false,
}: ImageCropperDialogProps) {
  const [loadedImage, setLoadedImage] = React.useState<HTMLImageElement | null>(
    null
  )
  const [isLoadingImage, setIsLoadingImage] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [zoom, setZoom] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const [offset, setOffset] = React.useState<CropOffset>({ x: 0, y: 0 })
  const [cropBox, setCropBox] = React.useState<CropBoxDimensions>({
    width: 280,
    height: 280,
  })

  // Derive source URL from imageFile or imageSrc
  const effectiveSrc = React.useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile)
    }
    return imageSrc || null
  }, [imageFile, imageSrc])

  // Load HTMLImageElement whenever effectiveSrc changes
  React.useEffect(() => {
    if (!open || !effectiveSrc) {
      setLoadedImage(null)
      return
    }

    setIsLoadingImage(true)
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      setLoadedImage(img)
      setIsLoadingImage(false)
      setZoom(1)
      setRotation(0)
      setOffset({ x: 0, y: 0 })
    }

    img.onerror = () => {
      setIsLoadingImage(false)
      setLoadedImage(null)
    }

    img.src = effectiveSrc

    return () => {
      if (imageFile && effectiveSrc) {
        URL.revokeObjectURL(effectiveSrc)
      }
    }
  }, [open, effectiveSrc, imageFile])

  const handleRotate = React.useCallback(() => {
    setRotation((prev) => (prev + 90) % 360)
  }, [])

  const handleReset = React.useCallback(() => {
    setZoom(1)
    setRotation(0)
    setOffset({ x: 0, y: 0 })
  }, [])

  const handleClose = React.useCallback(() => {
    onCancel?.()
    onOpenChange(false)
  }, [onCancel, onOpenChange])

  const handleConfirm = async () => {
    if (!loadedImage) return
    setIsProcessing(true)

    try {
      const fileName = imageFile?.name || "cropped-avatar.webp"
      const isPerpendicular = rotation % 180 !== 0
      const rotW = isPerpendicular
        ? loadedImage.naturalHeight
        : loadedImage.naturalWidth
      const rotH = isPerpendicular
        ? loadedImage.naturalWidth
        : loadedImage.naturalHeight
      const baseScale = Math.max(cropBox.width / rotW, cropBox.height / rotH)
      const scale = baseScale * zoom

      const croppedFile = await cropAndCompressImage({
        image: loadedImage,
        cropBox,
        offset,
        scale,
        rotation,
        maxWidth,
        maxHeight,
        aspectRatio,
        quality,
        format,
        fileName,
      })

      onCropComplete(croppedFile)
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to crop image:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{title}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {isLoadingImage || !loadedImage ? (
            <div className="flex h-[340px] items-center justify-center rounded-2xl border border-border bg-muted/20">
              <Spinner className="size-8 text-foreground" />
            </div>
          ) : (
            <>
              <ImageCropperViewport
                image={loadedImage}
                zoom={zoom}
                rotation={rotation}
                offset={offset}
                onOffsetChange={setOffset}
                onZoomChange={setZoom}
                cropShape={cropShape}
                aspectRatio={aspectRatio}
                cropBox={cropBox}
                onCropBoxChange={setCropBox}
              />

              <ImageCropperControls
                zoom={zoom}
                onZoomChange={setZoom}
                onRotate={handleRotate}
                onReset={handleReset}
                maxWidth={maxWidth}
                maxHeight={maxHeight}
                disabled={isProcessing || disabled}
              />
            </>
          )}
        </div>

        <FormDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              isProcessing || isLoadingImage || !loadedImage || disabled
            }
          >
            {isProcessing ? (
              <Spinner className="me-2 size-4 text-primary-foreground" />
            ) : (
              <Check className="me-1.5 size-4" />
            )}
            <span>{confirmLabel}</span>
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
