import type { BranchWithStats } from "@workspace/types"

export interface EditBranchModalProps {
  branch: BranchWithStats | null
  open: boolean
  onClose: () => void
}
