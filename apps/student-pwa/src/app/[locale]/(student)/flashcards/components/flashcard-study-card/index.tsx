"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Sparkles, CheckCircle, RotateCw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export interface FlashcardStudyCardProps {
  boxDueText: string
  wordOfTheDayText: string
  word: string
  phonetic: string
  definition: string
  onReviewAgain?: () => void
  onKnowThis?: () => void
}

export function FlashcardStudyCard({
  boxDueText,
  wordOfTheDayText,
  word,
  phonetic,
  definition,
  onReviewAgain,
  onKnowThis,
}: FlashcardStudyCardProps) {
  const t = useTranslations("flashcards")

  return (
    <div className="flex flex-col gap-5 border-y border-border/60 py-6">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {boxDueText}
        </span>
        <Sparkles className="size-4 text-warning" />
      </div>

      <div className="py-2 text-center">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {wordOfTheDayText}
        </span>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          {word}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{phonetic}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground italic">
          {definition}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onReviewAgain}
          className="h-12 cursor-pointer gap-1.5 rounded-xl border-border text-xs font-semibold text-foreground hover:bg-muted"
        >
          <RotateCw className="size-3.5" />
          <span>{t("reviewAgain")}</span>
        </Button>
        <Button
          type="button"
          onClick={onKnowThis}
          className="h-12 cursor-pointer gap-1.5 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <CheckCircle className="size-3.5" />
          <span>{t("knowThis")}</span>
        </Button>
      </div>
    </div>
  )
}
