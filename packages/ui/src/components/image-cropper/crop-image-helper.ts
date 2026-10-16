import type { CropBoxDimensions, CropOffset, ImageFormat } from "./types"

export interface CropImageParams {
  image: HTMLImageElement
  cropBox: CropBoxDimensions
  offset: CropOffset
  scale: number
  rotation: number // degrees (0, 90, 180, 270)
  maxWidth?: number
  maxHeight?: number
  aspectRatio?: number
  quality?: number
  format?: ImageFormat
  fileName?: string
}

function replaceFileExtension(fileName: string, newExt: string): string {
  const dotIndex = fileName.lastIndexOf(".")
  const baseName = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName
  return `${baseName}${newExt}`
}

export function createRotatedImage(
  image: HTMLImageElement,
  rotation: number
): {
  canvas: HTMLCanvasElement
  width: number
  height: number
} {
  const rads = (rotation * Math.PI) / 180
  const isPerpendicular = rotation % 180 !== 0
  const width = isPerpendicular ? image.naturalHeight : image.naturalWidth
  const height = isPerpendicular ? image.naturalWidth : image.naturalHeight

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Unable to create canvas context")
  }

  ctx.imageSmoothingQuality = "high"
  ctx.translate(width / 2, height / 2)
  ctx.rotate(rads)
  ctx.drawImage(
    image,
    -image.naturalWidth / 2,
    -image.naturalHeight / 2,
    image.naturalWidth,
    image.naturalHeight
  )

  return { canvas, width, height }
}

export async function cropAndCompressImage({
  image,
  cropBox,
  offset,
  scale,
  rotation,
  maxWidth = 512,
  maxHeight = 512,
  aspectRatio = 1,
  quality = 0.85,
  format = "image/webp",
  fileName = "avatar.webp",
}: CropImageParams): Promise<File> {
  const normalizedRotation = ((rotation % 360) + 360) % 360
  const {
    canvas: rotatedCanvas,
    width: rotWidth,
    height: rotHeight,
  } = createRotatedImage(image, normalizedRotation)

  // Source width and height in the rotated image coordinates
  const sourceWidth = cropBox.width / scale
  const sourceHeight = cropBox.height / scale

  // Source top-left coordinate in the rotated image coordinates
  const sourceX = rotWidth / 2 - offset.x / scale - sourceWidth / 2
  const sourceY = rotHeight / 2 - offset.y / scale - sourceHeight / 2

  // Determine output dimensions maintaining aspect ratio, constrained by maxWidth & maxHeight
  let outputWidth = Math.min(maxWidth, Math.round(sourceWidth))
  let outputHeight = Math.round(outputWidth / aspectRatio)

  if (outputHeight > maxHeight) {
    outputHeight = maxHeight
    outputWidth = Math.round(outputHeight * aspectRatio)
  }

  if (outputWidth <= 0 || outputHeight <= 0) {
    outputWidth = maxWidth
    outputHeight = maxHeight
  }

  const outputCanvas = document.createElement("canvas")
  outputCanvas.width = outputWidth
  outputCanvas.height = outputHeight
  const ctx = outputCanvas.getContext("2d")
  if (!ctx) {
    throw new Error("Failed to get output canvas 2D context")
  }

  ctx.imageSmoothingQuality = "high"

  // Draw the selected region from the rotated canvas onto the output canvas
  ctx.drawImage(
    rotatedCanvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputWidth,
    outputHeight
  )

  const extension =
    format === "image/webp" ? ".webp" : format === "image/png" ? ".png" : ".jpg"
  const outputFileName = replaceFileExtension(fileName, extension)

  return new Promise<File>((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => {
        if (!blob) {
          // If browser canvas does not support webp, fallback to jpeg
          outputCanvas.toBlob(
            (fallbackBlob) => {
              if (!fallbackBlob) {
                reject(new Error("Failed to export canvas to blob"))
                return
              }
              const jpgName = replaceFileExtension(fileName, ".jpg")
              resolve(new File([fallbackBlob], jpgName, { type: "image/jpeg" }))
            },
            "image/jpeg",
            quality
          )
          return
        }
        resolve(new File([blob], outputFileName, { type: blob.type }))
      },
      format,
      quality
    )
  })
}
