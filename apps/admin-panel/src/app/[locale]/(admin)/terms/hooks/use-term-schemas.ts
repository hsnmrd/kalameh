"use client"

import * as React from "react"
import {
  createCreateTermSchema,
  createUpdateTermSchema,
  type CreateTermInput,
  type UpdateTermInput,
} from "@workspace/types"

export type { CreateTermInput, UpdateTermInput }

export function useCreateTermSchema() {
  return React.useMemo(() => {
    return createCreateTermSchema()
  }, [])
}

export function useUpdateTermSchema() {
  return React.useMemo(() => {
    return createUpdateTermSchema()
  }, [])
}
