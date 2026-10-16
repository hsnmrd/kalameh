import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@/test/test-utils"
import { Attachment } from "@workspace/ui/components/attachment"

describe("Attachment with Cropper", () => {
  beforeEach(() => {
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn(
        () => "blob:http://localhost/mock-blob"
      )
    } else {
      vi.spyOn(window.URL, "createObjectURL").mockReturnValue(
        "blob:http://localhost/mock-blob"
      )
    }
    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = vi.fn()
    } else {
      vi.spyOn(window.URL, "revokeObjectURL").mockImplementation(() => {})
    }
  })

  it("renders standard attachment when crop is not enabled", () => {
    const onChange = vi.fn()
    const { container } = render(
      <Attachment placeholder="Upload an image or logo" onChange={onChange} />
    )

    expect(screen.getByText("Upload an image or logo")).toBeInTheDocument()
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    expect(input).toBeInTheDocument()

    const file = new File(["dummy content"], "photo.png", { type: "image/png" })
    fireEvent.change(input, { target: { files: [file] } })

    expect(onChange).toHaveBeenCalledWith(file)
  })

  it("opens cropper dialog when crop is enabled and user selects a raster image", async () => {
    const onChange = vi.fn()
    const { container } = render(
      <Attachment crop={true} label="تصویر پروفایل" onChange={onChange} />
    )

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    const file = new File(["dummy content"], "avatar.jpg", {
      type: "image/jpeg",
    })

    fireEvent.change(input, { target: { files: [file] } })

    // Should NOT call onChange immediately because cropper dialog intercepts it
    expect(onChange).not.toHaveBeenCalled()

    // Should display the cropper dialog with title and controls
    await waitFor(() => {
      expect(screen.getByText("برش و بهینه‌سازی تصویر")).toBeInTheDocument()
    })
    expect(screen.getByText("تأیید")).toBeInTheDocument()
    expect(screen.getByText("انصراف")).toBeInTheDocument()
  })

  it("bypasses cropper for vector SVG images even when crop is true", () => {
    const onChange = vi.fn()
    const { container } = render(
      <Attachment crop={true} label="لوگوی آموزشگاه" onChange={onChange} />
    )

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    const svgFile = new File(["<svg></svg>"], "logo.svg", {
      type: "image/svg+xml",
    })

    fireEvent.change(input, { target: { files: [svgFile] } })

    // SVG should bypass cropper directly
    expect(onChange).toHaveBeenCalledWith(svgFile)
    expect(screen.queryByText("برش و بهینه‌سازی تصویر")).not.toBeInTheDocument()
  })

  it("supports custom crop options like aspect ratio and shape", async () => {
    const onChange = vi.fn()
    const { container } = render(
      <Attachment
        crop={{
          aspectRatio: 16 / 9,
          cropShape: "rect",
          maxWidth: 1280,
          maxHeight: 720,
        }}
        label="بنر دوره"
        onChange={onChange}
      />
    )

    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    const file = new File(["dummy content"], "banner.png", {
      type: "image/png",
    })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText("برش و بهینه‌سازی تصویر")).toBeInTheDocument()
    })
  })
})

describe("cropAndCompressImage helper", () => {
  it("downscales and compresses image correctly via canvas", async () => {
    const { cropAndCompressImage } =
      await import("@workspace/ui/components/image-cropper/crop-image-helper")

    const mockCtx = {
      imageSmoothingQuality: "high",
      translate: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    }

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => mockCtx as unknown as CanvasRenderingContext2D
    )

    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback, type, _quality) => {
        const dummyBlob = new Blob(["mock-webp-data"], {
          type: (type as string) || "image/webp",
        })
        callback(dummyBlob)
      }
    )

    // Create a mock image element with natural dimensions
    const img = document.createElement("img")
    Object.defineProperty(img, "naturalWidth", { value: 2000 })
    Object.defineProperty(img, "naturalHeight", { value: 1500 })

    const result = await cropAndCompressImage({
      image: img,
      cropBox: { width: 400, height: 400 },
      offset: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      maxWidth: 512,
      maxHeight: 512,
      aspectRatio: 1,
      format: "image/webp",
      fileName: "original-photo.png",
    })

    expect(result).toBeInstanceOf(File)
    expect(result.name).toBe("original-photo.webp")
    expect(result.type).toBe("image/webp")
    expect(mockCtx.drawImage).toHaveBeenCalled()
  })
})
