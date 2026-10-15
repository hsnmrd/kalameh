import * as React from "react"
import { TableSkeleton } from "@/components/table-skeleton"
import { GeneratePhaseTermsPreviewContent } from "./components/generate-phase-terms-preview-content"

export default function GeneratePhaseTermsPage() {
  return (
    <React.Suspense fallback={<TableSkeleton rows={5} />}>
      <GeneratePhaseTermsPreviewContent />
    </React.Suspense>
  )
}
