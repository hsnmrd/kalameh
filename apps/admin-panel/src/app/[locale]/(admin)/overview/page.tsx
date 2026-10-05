"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ROLES } from "@workspace/types"
import { Spinner } from "@workspace/ui/components/spinner"
import { authResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { useRouter } from "@/i18n/routing"
import { InstituteAdminView } from "../(dashboard)/components/institute-admin-view"

export default function InstituteOverviewPage() {
  const { data: user, isLoading: isUserLoading } = useQuery(
    authResource.me.toQuery()
  )
  const { activeInstitute, isLoadingInstitutes } = useActiveInstitute()
  const router = useRouter()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const isLoading = isUserLoading || (isSuperAdmin && isLoadingInstitutes)

  React.useEffect(() => {
    if (!isLoading && isSuperAdmin && !activeInstitute) {
      router.replace("/")
    }
  }, [isLoading, isSuperAdmin, activeInstitute, router])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (isSuperAdmin && !activeInstitute) {
    return null
  }

  return <InstituteAdminView />
}
