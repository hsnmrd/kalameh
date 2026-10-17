"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import type { CropBoxDimensions, CropOffset, CropShape } from "./types"

export interface ImageCropperViewportProps {
  image: HTMLImageElement | null
  zoom: number
  rotation: number
  offset: CropOffset
  onOffsetChange: (offset: CropOffset) => void
  onZoomChange: (zoom: number) => void
  cropShape?: CropShape
  aspectRatio?: number
  cropBox: CropBoxDimensions
  onCropBoxChange: (box: CropBoxDimensions) => void
}

export function ImageCropperViewport({
  image,
  zoom,
  rotation,
  offset,
  onOffsetChange,
  onZoomChange,
  cropShape = "round",
  aspectRatio = 1,
  cropBox,
  onCropBoxChange,
}: ImageCropperViewportProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isDraggingRef = React.useRef(false)
  const dragStartRef = React.useRef({ x: 0, y: 0 })
  const initialOffsetRef = React.useRef<CropOffset>({ x: 0, y: 0 })
  const [isInteracting, setIsInteracting] = React.useState(false)

  // Measure container and set responsive crop box dimensions
  React.useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const maxW = Math.min(rect.width - 32, 320)
      const maxH = Math.min(rect.height - 32, 320)

      let boxW = maxW
      let boxH = boxW / aspectRatio

      if (boxH > maxH) {
        boxH = maxH
        boxW = boxH * aspectRatio
      }

      // Ensure minimum dimension while strictly preserving aspect ratio
      const minDimension = 100
      if (boxW < minDimension) {
        boxW = minDimension
        boxH = boxW / aspectRatio
      }
      if (boxH < minDimension) {
        boxH = minDimension
        boxW = boxH * aspectRatio
      }

      onCropBoxChange({
        width: Math.round(boxW),
        height: Math.round(boxH),
      })
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [aspectRatio, onCropBoxChange])

  // Calculate base scale so image always completely covers the crop box
  const baseScale = React.useMemo(() => {
    if (!image || cropBox.width === 0 || cropBox.height === 0) return 1
    const isPerpendicular = rotation % 180 !== 0
    const rotW = isPerpendicular ? image.naturalHeight : image.naturalWidth
    const rotH = isPerpendicular ? image.naturalWidth : image.naturalHeight

    return Math.max(cropBox.width / rotW, cropBox.height / rotH)
  }, [image, cropBox, rotation])

  const currentScale = baseScale * zoom

  // Clamp offset to ensure image does not show blank areas outside crop box
  const clampOffset = React.useCallback(
    (nextOffset: CropOffset): CropOffset => {
      if (!image || cropBox.width === 0 || cropBox.height === 0) {
        return nextOffset
      }
      const isPerpendicular = rotation % 180 !== 0
      const rotW = isPerpendicular ? image.naturalHeight : image.naturalWidth
      const rotH = isPerpendicular ? image.naturalWidth : image.naturalHeight

      const renderedW = rotW * currentScale
      const renderedH = rotH * currentScale

      const maxOffsetX = Math.max(0, (renderedW - cropBox.width) / 2)
      const maxOffsetY = Math.max(0, (renderedH - cropBox.height) / 2)

      return {
        x: Math.max(-maxOffsetX, Math.min(maxOffsetX, nextOffset.x)),
        y: Math.max(-maxOffsetY, Math.min(maxOffsetY, nextOffset.y)),
      }
    },
    [image, cropBox, rotation, currentScale]
  )

  // Keep offset clamped whenever zoom, rotation, or scale changes
  React.useEffect(() => {
    onOffsetChange(clampOffset(offset))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampOffset])

  // Pointer drag events for panning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!image) return
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    isDraggingRef.current = true
    setIsInteracting(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    initialOffsetRef.current = { ...offset }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y

    const nextOffset: CropOffset = {
      x: initialOffsetRef.current.x + dx,
      y: initialOffsetRef.current.y + dy,
    }

    onOffsetChange(clampOffset(nextOffset))
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsInteracting(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // Ignore if already released
    }
  }

  // Mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const zoomDelta = -e.deltaY * 0.0015
    const nextZoom = Math.max(1, Math.min(3, zoom + zoomDelta))
    onZoomChange(nextZoom)
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: "none" }}
      className="relative flex h-[340px] w-full cursor-grab items-center justify-center overflow-hidden rounded-2xl bg-neutral-950 select-none active:cursor-grabbing sm:h-[380px]"
    >
      {/* Transformed Source Image */}
      {image && (
        <div
          className="pointer-events-none absolute transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0px) scale(${currentScale}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt="Source image to crop"
            draggable={false}
            className="block max-w-none select-none"
            style={{
              width: image.naturalWidth,
              height: image.naturalHeight,
            }}
          />
        </div>
      )}

      {/* Dimmed Backdrop & Crop Window Frame */}
      <div
        className="pointer-events-none relative flex items-center justify-center"
        style={{
          width: cropBox.width,
          height: cropBox.height,
        }}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 border-2 border-white/85 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]",
            cropShape === "round" ? "rounded-full" : "rounded-2xl"
          )}
        >
          {/* Rule of Thirds Grid overlay (shown during interaction) */}
          <div
            className={cn(
              "grid size-full grid-cols-3 grid-rows-3 transition-opacity duration-200",
              isInteracting ? "opacity-35" : "opacity-0"
            )}
          >
            <div className="border-e border-b border-white" />
            <div className="border-e border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-e border-b border-white" />
            <div className="border-e border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-e border-white" />
            <div className="border-e border-white" />
            <div />
          </div>
        </div>
      </div>
    </div>
  )
}
