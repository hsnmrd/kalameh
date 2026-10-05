"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ROLES } from "@workspace/types"
import { authResource } from "@/lib/api"
import { SuperAdminView } from "./components/super-admin-view"
import { InstituteAdminView } from "./components/institute-admin-view"
import { DashboardSkeleton } from "./components/dashboard-skeleton"

export default function AdminDashboardPage() {
  const { data: user, isLoading } = useQuery(authResource.me.toQuery())

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (user?.role === ROLES.SUPER_ADMIN) {
    return <SuperAdminView />
  }

  return <InstituteAdminView />
}
