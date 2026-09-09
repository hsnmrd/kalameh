"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  BookOpenCheck,
  CalendarRange,
  CheckCheck,
  GitCompareArrows,
  GraduationCap,
  Sparkles,
  UserRoundCheck,
} from "lucide-react"
import {
  APP_MODULES,
  PERMISSIONS,
  type SchedulingRunDto,
} from "@workspace/types"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { AdminPageHeader } from "@/components/admin-page-header"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { Link } from "@/i18n/routing"
import { SchedulingGenerationForm } from "../scheduling-generation-form"
import { SchedulingRunCreated } from "../scheduling-run-created"

const workflowSteps = [
  { key: "prepare", icon: BookOpenCheck },
  { key: "generate", icon: Sparkles },
  { key: "review", icon: GitCompareArrows },
  { key: "publish", icon: CheckCheck },
] as const

const prerequisiteLinks = [
  {
    key: "terms",
    href: "/terms",
    icon: CalendarRange,
    permission: PERMISSIONS.VIEW_TERMS,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "teachers",
    href: "/teachers",
    icon: UserRoundCheck,
    permission: PERMISSIONS.VIEW_TEACHERS,
    module: APP_MODULES.CLASSES_COURSES,
  },
  {
    key: "students",
    href: "/students",
    icon: GraduationCap,
    permission: PERMISSIONS.VIEW_STUDENTS,
    module: APP_MODULES.STUDENTS,
  },
] as const

export function SchedulingWorkspace() {
  const t = useTranslations("scheduling")
  const [createdRun, setCreatedRun] = React.useState<SchedulingRunDto | null>(
    null
  )

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />

      <section
        aria-labelledby="scheduling-workflow-title"
        className="overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2
            id="scheduling-workflow-title"
            className="text-base font-bold text-foreground"
          >
            {t("workflow.title")}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {t("workflow.description")}
          </p>
        </div>

        <ol className="grid md:grid-cols-4">
          {workflowSteps.map(({ key, icon: Icon }) => (
            <li
              key={key}
              className="flex gap-3 border-b border-border p-5 last:border-b-0 md:border-e md:border-b-0 md:last:border-e-0"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {t(`workflow.steps.${key}.title`)}
                </span>
                <span className="text-xs leading-5 text-muted-foreground">
                  {t(`workflow.steps.${key}.description`)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(240px,0.34fr)_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-xs">
            <BookOpenCheck aria-hidden className="size-5" />
          </div>
          <h2 className="mt-4 font-bold text-foreground">{t("ready.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("ready.description")}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {prerequisiteLinks.map(
              ({ key, href, icon: Icon, permission, module }) => (
                <ModuleGuard key={key} module={module} mode="disable">
                  <PermissionGuard permission={permission} mode="disable">
                    <Link
                      href={href}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "h-11 w-full justify-start bg-background"
                      )}
                    >
                      <Icon data-icon="inline-start" aria-hidden />
                      {t(`ready.links.${key}`)}
                    </Link>
                  </PermissionGuard>
                </ModuleGuard>
              )
            )}
          </div>
        </aside>

        {createdRun ? (
          <SchedulingRunCreated
            run={createdRun}
            onReset={() => setCreatedRun(null)}
          />
        ) : (
          <SchedulingGenerationForm onCreated={setCreatedRun} />
        )}
      </div>
    </div>
  )
}
