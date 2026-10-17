"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { FlashcardStudyCard } from "./components/flashcard-study-card"

export default function StudentFlashcardsPage() {
  const t = useTranslations("flashcards")

  return (
    <div className="flex flex-col gap-4">
      <FlashcardStudyCard
        boxDueText={t("boxDue")}
        wordOfTheDayText={t("wordOfTheDay")}
        word={t("sampleWord")}
        phonetic={t("samplePhonetic")}
        definition={t("sampleDefinition")}
      />
    </div>
  )
}
