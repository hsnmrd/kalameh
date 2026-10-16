import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "@workspace/ui/components/button"
import { ImageCropperDialog } from "@workspace/ui/components/image-cropper"

const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"

function ImageCropperDemo({
  aspectRatio = 1,
  cropShape = "round",
}: {
  aspectRatio?: number
  cropShape?: "round" | "rect"
}) {
  const [open, setOpen] = React.useState(false)
  const [croppedUrl, setCroppedUrl] = React.useState<string | null>(null)

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Button onClick={() => setOpen(true)}>باز کردن ویرایشگر تصویر</Button>

      {croppedUrl && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">نتیجه برش خورده:</p>
          <img
            src={croppedUrl}
            alt="Cropped output"
            className="size-36 border border-border object-cover shadow-sm"
            style={{ borderRadius: cropShape === "round" ? "9999px" : "1rem" }}
          />
        </div>
      )}

      <ImageCropperDialog
        open={open}
        onOpenChange={setOpen}
        imageSrc={SAMPLE_IMAGE}
        aspectRatio={aspectRatio}
        cropShape={cropShape}
        maxWidth={512}
        maxHeight={512}
        onCropComplete={(file) => {
          setCroppedUrl(URL.createObjectURL(file))
          setOpen(false)
        }}
      />
    </div>
  )
}

const meta = {
  title: "Media/ImageCropper",
  component: ImageCropperDemo,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ImageCropperDemo>

export default meta
type Story = StoryObj<typeof meta>

export const RoundProfile: Story = {
  args: {
    aspectRatio: 1,
    cropShape: "round",
  },
}

export const RectBanner: Story = {
  args: {
    aspectRatio: 16 / 9,
    cropShape: "rect",
  },
}
