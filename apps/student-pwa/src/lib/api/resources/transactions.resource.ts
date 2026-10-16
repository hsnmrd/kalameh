import type { TransactionDto } from "@workspace/types"
import { api } from "../client"

export const transactionsResource = api.resource("transactions", {
  submit: api.post<TransactionDto, FormData>("/transactions", {
    bodyType: "form-data",
  }),
})
