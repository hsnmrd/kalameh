import { getTranslations } from "next-intl/server"
import { FileQuestion } from "lucide-react"
import { Link } from "@/i18n/routing"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export default async function LocalizedNotFound() {
  const t = await getTranslations("common.notFound")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-[420px] space-y-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-xs">
          <FileQuestion className="size-10 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <span className="inline-block rounded-full bg-muted px-3 py-1 font-mono text-xs font-bold tracking-wider text-muted-foreground">
            404 ERROR
          </span>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ size: "lg" }), "w-full rounded-xl")}
          >
            <span>{t("backHome")}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
