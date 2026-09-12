"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import type { OperatingPhaseWithSlots } from "@workspace/types"
import { operatingPhasesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export interface PhaseSelectFieldProps {
  value?: string | null
  onChange: (phaseId: string | null, phase?: OperatingPhaseWithSlots) => void
}

export function PhaseSelectField({ value, onChange }: PhaseSelectFieldProps) {
  const t = useTranslations("terms")
  const { activeInstituteId } = useActiveInstitute()

  const { data: phases = [] } = useQuery({
    ...operatingPhasesResource.list.toQuery({
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId),
  })

  const options: ComboboxOption[] = React.useMemo(() => {
    return phases.map((phase) => ({
      value: phase.id,
      label: phase.title,
    }))
  }, [phases])

  return (
    <Field>
      <FieldLabel>{t("createModal.operatingPhase")}</FieldLabel>
      <ResponsiveCombobox
        items={options}
        value={value || ""}
        onValueChange={(val) => {
          const found = phases.find((p) => p.id === val)
          onChange(val || null, found)
        }}
        placeholder={t("createModal.operatingPhasePlaceholder")}
        drawerTitle={t("createModal.operatingPhase")}
        clearable
      />
    </Field>
  )
}
