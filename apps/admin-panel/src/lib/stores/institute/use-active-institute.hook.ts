"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ROLES } from "@workspace/types"
import { authResource, institutesResource } from "@/lib/api"
import { useActiveInstituteStore } from "./institute.store"

export function useActiveInstitute() {
  const storeActiveInstitute = useActiveInstituteStore(
    (state) => state.activeInstitute
  )
  const selectInstitute = useActiveInstituteStore(
    (state) => state.selectInstitute
  )
  const clearActiveInstitute = useActiveInstituteStore(
    (state) => state.clearActiveInstitute
  )
  const setActiveInstitute = useActiveInstituteStore(
    (state) => state.setActiveInstitute
  )

  const { data: user } = useQuery(authResource.me.toQuery())
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const { data: institutes = [], isLoading: isLoadingInstitutes } = useQuery({
    ...institutesResource.list.toQuery(),
    enabled: isSuperAdmin,
  })

  // Synchronously derive fresh institute details from query if available
  const activeInstitute = React.useMemo(() => {
    if (!storeActiveInstitute) return null
    const fresh = institutes.find((i) => i.id === storeActiveInstitute.id)
    return fresh ?? storeActiveInstitute
  }, [institutes, storeActiveInstitute])

  const isSuperAdminManaging = isSuperAdmin && activeInstitute !== null

  const activeInstituteId = isSuperAdmin
    ? activeInstitute?.id
    : user?.instituteId

  return {
    activeInstitute,
    activeInstituteId,
    isSuperAdminManaging,
    institutes,
    isLoadingInstitutes,
    selectInstitute,
    clearActiveInstitute,
    setActiveInstitute,
  }
}
