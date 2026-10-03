"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { FlashcardStudyCard } from "./components/flashcard-study-card"

export default function StudentFlashcardsPage() {
  const t = useTranslations("flashcards")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-4">
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
