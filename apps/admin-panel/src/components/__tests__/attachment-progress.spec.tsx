import { describe, it, expect } from "vitest"
import { render, screen } from "../../test/test-utils"
import { Attachment } from "@workspace/ui/components/attachment"

describe("Attachment upload progress", () => {
  it("should render upload progress bar and percentage when uploadProgress is provided", () => {
    const mockFile = new File(["dummy content"], "avatar.png", {
      type: "image/png",
    })

    render(
      <Attachment
        value={mockFile}
        uploadProgress={65}
        uploadProgressLabel="در حال بارگذاری..."
      />
    )

    const progressBar = screen.getByRole("progressbar")
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute("aria-valuenow", "65")
    expect(screen.getByText("65%")).toBeInTheDocument()
    expect(screen.getByText("در حال بارگذاری...")).toBeInTheDocument()
  })

  it("should disable action buttons while uploading", () => {
    const mockFile = new File(["dummy content"], "avatar.png", {
      type: "image/png",
    })

    render(<Attachment value={mockFile} uploadProgress={40} />)

    const changeButton = screen.getByRole("button", { name: /change/i })
    expect(changeButton).toBeDisabled()

    const removeButton = screen.getByRole("button", { name: /remove/i })
    expect(removeButton).toBeDisabled()
  })
})
