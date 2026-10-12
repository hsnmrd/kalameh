import type { BankInfoDto } from "@workspace/types"
import { api } from "../client"

export const institutesResource = api.resource("institutes", {
  bankInfo: api.get<BankInfoDto>("/institutes/bank-info"),
})
