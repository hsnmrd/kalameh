"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  PERMISSIONS,
  APP_MODULES,
  ROLES,
  type SingleStudentGradeInput,
} from "@workspace/types"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { gradesResource, classesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { Link, useIsRtl } from "@/i18n/routing"
import { Button } from "@workspace/ui/components/button"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ClassInfoCard } from "./components/class-info-card"
import { GradesTable } from "./components/grades-table"
import { GradesList } from "./components/grades-list"

export default function ClassGradesPage() {
  const t = useTranslations("grades")
  const isRtl = useIsRtl()
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft
  const params = useParams()
  const classId = params.id as string
  const queryClient = useQueryClient()

  const { activeInstitute } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.GRADES_ASSESSMENTS)

  const { data: cls } = useQuery({
    ...classesResource.detail.toQuery(classId),
    enabled: Boolean(classId && hasModule),
  })
  const { data: records, isLoading } = useQuery({
    ...gradesResource.getClassGrades.toQuery(classId),
    enabled: Boolean(classId && hasModule),
  })

  const submitMutation = useMutation({
    ...gradesResource.submitClassGrades.toMutation(),
    onSuccess: () => {
      toast.success(t("success"))
      queryClient.invalidateQueries({
        queryKey: gradesResource.getClassGrades.baseKey(),
      })
    },
  })

  const handleSubmit = (grades: SingleStudentGradeInput[]) => {
    submitMutation.mutate({
      classId,
      body: { grades },
    })
  }

  return (
    <ModuleGuard module={APP_MODULES.GRADES_ASSESSMENTS}>
      <PermissionGuard
        permission={[PERMISSIONS.VIEW_GRADES, PERMISSIONS.MANAGE_GRADES]}
        mode="forbidden"
      >
        <AdminPageShell
          filter={
            <div className="space-y-4">
              <Link href="/classes">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 p-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowIcon className="size-3.5" />
                  <span>{t("backToClasses")}</span>
                </Button>
              </Link>
              <ClassInfoCard cls={cls} studentsCount={records?.length ?? 0} />
            </div>
          }
        >
          {/* Desktop: DataTable */}
          <div className="hidden lg:block">
            <GradesTable
              records={records}
              isLoading={isLoading}
              isSubmitting={submitMutation.isPending}
              onSubmit={handleSubmit}
            />
          </div>

          {/* Mobile: flat list */}
          <div className="lg:hidden">
            <GradesList
              records={records}
              isLoading={isLoading}
              isSubmitting={submitMutation.isPending}
              onSubmit={handleSubmit}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
