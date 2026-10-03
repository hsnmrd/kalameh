import type { TermDto } from "@workspace/types"
import type { UpdateTermInput } from "../../../hooks/use-term-schemas"
import { formatDateForInput } from "../hooks/use-edit-term-calendar-state"

export const EMPTY_TERM_VALUES: UpdateTermInput = {
  title: "",
  startDate: "",
  endDate: "",
  isActive: true,
  operatingPhaseId: undefined,
}

export function buildEditTermFormValues(term: TermDto | null): UpdateTermInput {
  if (!term) return EMPTY_TERM_VALUES
  return {
    title: term.title,
    startDate: formatDateForInput(term.startDate),
    endDate: formatDateForInput(term.endDate),
    isActive: term.isActive,
    operatingPhaseId: term.operatingPhaseId || undefined,
  }
}
