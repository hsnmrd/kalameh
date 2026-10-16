"use client"

import * as React from "react"
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Sparkles } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"

export interface ImageCropperControlsProps {
  zoom: number
  onZoomChange: (zoom: number) => void
  onRotate: () => void
  onReset: () => void
  maxWidth?: number
  maxHeight?: number
  disabled?: boolean
}

export function ImageCropperControls({
  zoom,
  onZoomChange,
  onRotate,
  onReset,
  maxWidth = 512,
  maxHeight = 512,
  disabled = false,
}: ImageCropperControlsProps) {
  const minZoom = 1
  const maxZoom = 3

  const handleZoomOut = () => {
    onZoomChange(Math.max(minZoom, zoom - 0.2))
  }

  const handleZoomIn = () => {
    onZoomChange(Math.min(maxZoom, zoom + 0.2))
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onZoomChange(parseFloat(e.target.value))
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4">
      {/* Zoom Slider Row */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled || zoom <= minZoom}
          onClick={handleZoomOut}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Zoom out"
        >
          <ZoomOut className="size-4" />
        </Button>

        <div className="relative flex flex-1 items-center">
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.05}
            value={zoom}
            disabled={disabled}
            onChange={handleSliderChange}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary focus:outline-hidden disabled:cursor-not-allowed"
            aria-label="Zoom level"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled || zoom >= maxZoom}
          onClick={handleZoomIn}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Zoom in"
        >
          <ZoomIn className="size-4" />
        </Button>
      </div>

      {/* Action Buttons & Optimization Info */}
      <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={onRotate}
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
          >
            <RotateCw className="size-3.5" />
            <span>چرخش ۹۰°</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onReset}
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            <span>بازنشانی</span>
          </Button>
        </div>

        <Badge
          variant="secondary"
          className="hidden items-center gap-1.5 px-2.5 py-1 text-[11px] font-normal text-muted-foreground sm:inline-flex"
        >
          <Sparkles className="size-3" />
          <span>
            {maxWidth}×{maxHeight} پیکسل • بهینه‌سازی خودکار
          </span>
        </Badge>
      </div>
    </div>
  )
}
