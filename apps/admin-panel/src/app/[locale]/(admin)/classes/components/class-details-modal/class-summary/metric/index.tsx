import type { ReactNode } from "react"

interface MetricProps {
  icon: ReactNode
  label: string
  children: ReactNode
}

export function Metric({ icon, label, children }: MetricProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium text-muted-foreground">
          {label}
        </span>
        {children}
      </div>
    </div>
  )
}
