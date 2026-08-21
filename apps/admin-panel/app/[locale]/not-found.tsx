import { getTranslations } from "next-intl/server"
import { FileQuestion } from "lucide-react"
import { Link } from "@/i18n/routing"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export default async function LocalizedNotFound() {
  const t = await getTranslations("common.notFound")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-xs">
          <FileQuestion className="size-10 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <span className="inline-block rounded-full bg-slate-200/80 px-3 py-1 font-mono text-xs font-bold tracking-wider text-slate-700">
            404 ERROR
          </span>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
            {t("description")}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl px-6")}
          >
            <span>{t("backHome")}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
