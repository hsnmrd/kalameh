import type {
  ClassRequirementDto,
  ClassRequirementFilter,
} from "@workspace/types"
import { api } from "../client"

export const classRequirementsResource = api.resource("class-requirements", {
  list: api.get<ClassRequirementDto[], ClassRequirementFilter | void>(
    "/class-requirements",
    {
      query: (params) => params || {},
    }
  ),
})
