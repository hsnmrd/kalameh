import type {
  CompensatorySession,
  GeneratedTermProposal,
} from "@workspace/types"

export interface DayActionsPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorEl: HTMLElement | null
  date: Date | null
  termProposal?: GeneratedTermProposal
  selectedTermIndex: number
  proposals: GeneratedTermProposal[]
  onSetStartDate?: (termIndex: number, dateYmd: string) => void
  onToggleHoliday?: (dateYmd: string) => void
  onToggleCustomOffDay?: (dateYmd: string) => void
  onOpenCompensatoryModal?: (
    termIndex: number,
    dateYmd: string,
    defaultTrack?: "ODD" | "EVEN"
  ) => void
  onRemoveCompensatorySession?: (termIndex: number, dateYmd: string) => void
  locale?: "fa" | "en"
  observeOfficialHolidays?: boolean
  customOffDays?: string[]
  activeDismissedHolidays?: string[]
  compensatorySessions?: Record<number, CompensatorySession[]>
  lockedTermIndex?: number
  readOnly?: boolean
}
