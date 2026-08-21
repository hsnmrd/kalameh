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
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {boxDueText}
        </span>
        <Sparkles className="size-4 text-amber-500" />
      </div>

      <div className="py-4 text-center">
        <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
          {wordOfTheDayText}
        </span>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{word}</h2>
        <p className="mt-2 text-sm text-slate-500">{phonetic}</p>
        <p className="mt-2 text-xs text-slate-600 italic">{definition}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onReviewAgain}
          className="cursor-pointer gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <RotateCw className="size-3.5" />
          <span>{t("reviewAgain")}</span>
        </Button>
        <Button
          type="button"
          onClick={onKnowThis}
          className="cursor-pointer gap-1.5 bg-black text-white hover:bg-slate-800"
        >
          <CheckCircle className="size-3.5" />
          <span>{t("knowThis")}</span>
        </Button>
      </div>
    </div>
  )
}
