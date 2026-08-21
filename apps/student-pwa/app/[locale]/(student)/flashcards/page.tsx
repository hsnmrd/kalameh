"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { FlashcardStudyCard } from "./components/flashcard-study-card"

export default function StudentFlashcardsPage() {
  const t = useTranslations("flashcards")

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {t("title")}
        </h1>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <div className="space-y-4">
        <FlashcardStudyCard
          boxDueText={t("boxDue")}
          wordOfTheDayText={t("wordOfTheDay")}
          word={t("sampleWord")}
          phonetic={t("samplePhonetic")}
          definition={t("sampleDefinition")}
        />
      </div>
    </div>
  )
}
