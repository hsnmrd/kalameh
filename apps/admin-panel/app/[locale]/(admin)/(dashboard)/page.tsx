"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ROLES } from "@workspace/types"
import { Spinner } from "@workspace/ui/components/spinner"
import { authResource } from "@/lib/api"
import { SuperAdminView } from "./components/super-admin-view"
import { InstituteAdminView } from "./components/institute-admin-view"

export default function AdminDashboardPage() {
  const { data: user, isLoading } = useQuery(authResource.me.toQuery())

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="size-8 text-slate-700" />
      </div>
    )
  }

  if (user?.role === ROLES.SUPER_ADMIN) {
    return <SuperAdminView />
  }

  return <InstituteAdminView />
}
