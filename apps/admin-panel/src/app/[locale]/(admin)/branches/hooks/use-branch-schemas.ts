"use client"

import * as React from "react"
import {
  createCreateBranchSchema,
  createUpdateBranchSchema,
  type CreateBranchInput,
  type UpdateBranchInput,
} from "@workspace/types"

export type { CreateBranchInput, UpdateBranchInput }

export function useCreateBranchSchema() {
  return React.useMemo(() => {
    return createCreateBranchSchema()
  }, [])
}

export function useUpdateBranchSchema() {
  return React.useMemo(() => {
    return createUpdateBranchSchema()
  }, [])
}
