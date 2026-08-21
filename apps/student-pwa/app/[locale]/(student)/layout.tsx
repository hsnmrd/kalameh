import * as React from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { StudentBaseLayout } from "@/components/student-base-layout"

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages({ locale })
  const studentMessages = {
    common: messages.common,
    classes: messages.classes,
    dashboard: messages.dashboard,
    enrollments: messages.enrollments,
    flashcards: messages.flashcards,
    profile: messages.profile,
  }

  return (
    <NextIntlClientProvider messages={studentMessages}>
      <StudentBaseLayout>{children}</StudentBaseLayout>
    </NextIntlClientProvider>
  )
}
