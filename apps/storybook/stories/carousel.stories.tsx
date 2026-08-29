import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Badge } from "@workspace/ui/components/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"

const lessons = ["Vocabulary", "Listening", "Grammar", "Conversation"]

const meta = {
  title: "Media/Carousel",
  component: Carousel,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

export const LessonCards: Story = {
  render: () => (
    <Carousel className="w-80" aria-label="Featured lessons">
      <CarouselContent>
        {lessons.map((lesson, index) => (
          <CarouselItem key={lesson}>
            <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-border bg-card p-5 text-card-foreground">
              <Badge variant="secondary">Lesson {index + 1}</Badge>
              <div>
                <p className="text-lg font-semibold">{lesson}</p>
                <p className="text-sm text-muted-foreground">
                  Continue your current learning path.
                </p>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
}
