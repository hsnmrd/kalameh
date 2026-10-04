"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock } from "lucide-react"
import { Link } from "@/i18n/routing"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"

export function NoOperatingPhaseAlert() {
  const t = useTranslations("students.noOperatingPhase")

  return (
    <div className="flex min-h-[45vh] items-center justify-center p-4">
      <Empty variant="ghost" className="w-full max-w-md py-8">
        <EmptyHeader>
          <EmptyMedia className="size-14 rounded-2xl bg-muted/70 text-muted-foreground">
            <Clock className="size-7" />
          </EmptyMedia>
          <EmptyTitle className="text-base font-bold text-foreground sm:text-lg">
            {t("title")}
          </EmptyTitle>
          <EmptyDescription className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("description")}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            href="/operating-phases"
            className={cn(buttonVariants({ size: "default" }), "gap-2")}
          >
            <Clock className="size-4" />
            <span>{t("action")}</span>
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}
