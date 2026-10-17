import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { UploadReceiptCard } from "../index"
import enrollmentsMessagesFa from "@/messages/fa/enrollments.json"

// Mock ImageCropperDialog to facilitate component-level testing of the cropping flow
vi.mock("@workspace/ui/components/image-cropper", () => {
  return {
    ImageCropperDialog: ({
      open,
      aspectRatio,
      aspectRatioOptions,
      onCropComplete,
      onCancel,
    }: {
      open: boolean
      aspectRatio?: number
      aspectRatioOptions?: Array<{ label: string; value: number }>
      onCropComplete: (file: File) => void
      onCancel: () => void
    }) => {
      if (!open) return null
      return (
        <div data-testid="mock-image-cropper-dialog">
          <span data-testid="active-aspect-ratio">{aspectRatio}</span>
          <div data-testid="ratio-options">
            {aspectRatioOptions?.map((opt) => (
              <span key={opt.label} data-testid={`ratio-${opt.label}`}>
                {opt.label}:{opt.value}
              </span>
            ))}
          </div>
          <button
            type="button"
            data-testid="mock-confirm-crop"
            onClick={() => {
              const mockCroppedFile = new File(
                ["cropped-content"],
                "receipt.webp",
                {
                  type: "image/webp",
                }
              )
              onCropComplete(mockCroppedFile)
            }}
          >
            Confirm Crop
          </button>
          <button
            type="button"
            data-testid="mock-cancel-crop"
            onClick={onCancel}
          >
            Cancel Crop
          </button>
        </div>
      )
    },
  }
})

describe("UploadReceiptCard Component", () => {
  const customMessages = {
    enrollments: enrollmentsMessagesFa,
  }

  const defaultProps = {
    classId: "class-123",
    tuition: 1500000,
    onSubmitReceipt: vi.fn(),
    onCancelReservation: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn(() => "blob:mock-receipt-url")
    global.URL.revokeObjectURL = vi.fn()
  })

  it("should render upload area, tracking code input, and buttons", () => {
    render(<UploadReceiptCard {...defaultProps} />, {
      messages: customMessages,
    })

    expect(
      screen.getByText(enrollmentsMessagesFa.upload.title)
    ).toBeInTheDocument()
    expect(
      screen.getByText(enrollmentsMessagesFa.upload.selectImage)
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        enrollmentsMessagesFa.upload.trackingCodePlaceholder
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: enrollmentsMessagesFa.upload.submit,
      })
    ).toBeInTheDocument()
  })

  it("should open cropper dialog when a file is selected and not use 1:1 by default", () => {
    const { container } = render(<UploadReceiptCard {...defaultProps} />, {
      messages: customMessages,
    })

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    const rawFile = new File(["dummy-image-bytes"], "receipt.jpg", {
      type: "image/jpeg",
    })
    fireEvent.change(fileInput, { target: { files: [rawFile] } })

    // Cropper dialog should now be open
    expect(screen.getByTestId("mock-image-cropper-dialog")).toBeInTheDocument()

    // Default aspect ratio must NOT be 1 (user requested: dont use 1:1)
    const ratioElement = screen.getByTestId("active-aspect-ratio")
    expect(ratioElement.textContent).toBe("0.75") // 3:4

    // Ratios should include portrait, landscape, wide, square, and original
    expect(screen.getByTestId("ratio-۳:۴")).toBeInTheDocument()
    expect(screen.getByTestId("ratio-۴:۳")).toBeInTheDocument()
    expect(screen.getByTestId("ratio-۱۶:۹")).toBeInTheDocument()
    expect(screen.getByTestId("ratio-۱:۱")).toBeInTheDocument()
    expect(screen.getByTestId("ratio-اصلی")).toBeInTheDocument()
  })

  it("should update preview and allow form submission after cropping", () => {
    const { container } = render(<UploadReceiptCard {...defaultProps} />, {
      messages: customMessages,
    })

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    const rawFile = new File(["dummy-image-bytes"], "receipt.jpg", {
      type: "image/jpeg",
    })
    fireEvent.change(fileInput, { target: { files: [rawFile] } })

    // Confirm crop
    fireEvent.click(screen.getByTestId("mock-confirm-crop"))

    // Preview should now be visible and cropper closed
    expect(
      screen.queryByTestId("mock-image-cropper-dialog")
    ).not.toBeInTheDocument()
    expect(screen.getByAltText("Receipt preview")).toBeInTheDocument()
    expect(screen.getByText("receipt.webp")).toBeInTheDocument()

    // Enter tracking code and submit
    const trackingInput = screen.getByPlaceholderText(
      enrollmentsMessagesFa.upload.trackingCodePlaceholder
    )
    fireEvent.change(trackingInput, { target: { value: "TRK-987654" } })

    const submitButton = screen.getByRole("button", {
      name: enrollmentsMessagesFa.upload.submit,
    })
    expect(submitButton).not.toBeDisabled()
    fireEvent.click(submitButton)

    expect(defaultProps.onSubmitReceipt).toHaveBeenCalledTimes(1)
    expect(defaultProps.onSubmitReceipt).toHaveBeenCalledWith({
      trackingCode: "TRK-987654",
      file: expect.any(File),
    })
  })
})
