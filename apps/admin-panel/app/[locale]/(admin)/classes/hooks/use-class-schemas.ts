"use client"

import * as React from "react"
import {
  createCreateClassSchema,
  createUpdateClassSchema,
  type CreateClassInput,
  type UpdateClassInput,
} from "@workspace/types"

export type { CreateClassInput, UpdateClassInput }

export function useCreateClassSchema() {
  return React.useMemo(() => {
    return createCreateClassSchema()
  }, [])
}

export function useUpdateClassSchema() {
  return React.useMemo(() => {
    return createUpdateClassSchema()
  }, [])
}
