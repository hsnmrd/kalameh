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

  // Synchronously derive fresh institute details from query or user profile
  const activeInstitute = React.useMemo(() => {
    if (isSuperAdmin) {
      if (!storeActiveInstitute) return null
      const fresh = institutes.find((i) => i.id === storeActiveInstitute.id)
      return fresh ?? storeActiveInstitute
    }

    return user?.institute ?? null
  }, [institutes, storeActiveInstitute, isSuperAdmin, user?.institute])

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
