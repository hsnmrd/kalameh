import type {
  CreateTransactionInput,
  TransactionDto,
  TransactionFilterInput,
  UpdateTransactionStatusInput,
} from "@workspace/types"
import { api } from "../client"

export const transactionsResource = api.resource("transactions", {
  list: api.get<TransactionDto[], TransactionFilterInput | undefined>(
    "/transactions",
    { query: (params) => params || {} }
  ),
  detail: api.get<TransactionDto, string>((id) => `/transactions/${id}`),
  submit: api.post<TransactionDto, CreateTransactionInput>("/transactions", {
    bodyType: "form-data",
  }),
  updateStatus: api.patch<
    TransactionDto,
    { id: string; body: UpdateTransactionStatusInput }
  >(({ id }) => `/transactions/${id}/status`, {
    body: ({ body }) => body,
  }),
})
