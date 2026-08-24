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
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-600">
          {boxDueText}
        </span>
        <Sparkles className="size-4 text-amber-500" />
      </div>

      <div className="py-4 text-center">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {wordOfTheDayText}
        </span>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{word}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{phonetic}</p>
        <p className="mt-2 text-xs text-muted-foreground italic">
          {definition}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onReviewAgain}
          className="cursor-pointer gap-1.5 border-border text-foreground hover:bg-muted"
        >
          <RotateCw className="size-3.5" />
          <span>{t("reviewAgain")}</span>
        </Button>
        <Button
          type="button"
          onClick={onKnowThis}
          className="cursor-pointer gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <CheckCircle className="size-3.5" />
          <span>{t("knowThis")}</span>
        </Button>
      </div>
    </div>
  )
}
