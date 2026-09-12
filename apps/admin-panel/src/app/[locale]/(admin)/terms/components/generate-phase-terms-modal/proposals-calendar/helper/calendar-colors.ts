import { isJalaliHoliday, type GeneratedTermProposal } from "@workspace/types"

export interface TermColorTheme {
  id: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  dotColor: string
  accentColor: string
  rangeClassRtl: string
  rangeClassLtr: string
  rangeClass: string
  startPillRtl: string
  startPillLtr: string
  endPillRtl: string
  endPillLtr: string
  singlePill: string
  startClassRtl: string
  startClassLtr: string
  startClass: string
  endClassRtl: string
  endClassLtr: string
  endClass: string
  singleClass: string
}

export const TERM_COLOR_PALETTES: TermColorTheme[] = [
  {
    id: "blue",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-500/30",
    dotColor: "bg-blue-600",
    accentColor: "#2563eb",
    rangeClassRtl:
      "!bg-blue-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-blue-500/25",
    rangeClassLtr:
      "!bg-blue-500/15 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-blue-500/25",
    rangeClass:
      "!bg-blue-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-blue-500/25",
    startPillRtl:
      "!bg-blue-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    startPillLtr:
      "!bg-blue-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillRtl:
      "!bg-blue-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillLtr:
      "!bg-blue-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    singlePill: "!bg-blue-500/15 rounded-full",
    startClassRtl:
      "!bg-blue-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    startClassLtr:
      "!bg-blue-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:shadow-xs",
    endClassRtl:
      "!bg-blue-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    endClassLtr:
      "!bg-blue-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
    startClass:
      "!bg-blue-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    endClass:
      "!bg-blue-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    singleClass:
      "rounded-full [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-full [&>button]:shadow-xs",
  },
  {
    id: "emerald",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-500/30",
    dotColor: "bg-emerald-600",
    accentColor: "#059669",
    rangeClassRtl:
      "!bg-emerald-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-emerald-500/25",
    rangeClassLtr:
      "!bg-emerald-500/15 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-emerald-500/25",
    rangeClass:
      "!bg-emerald-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-emerald-500/25",
    startPillRtl:
      "!bg-emerald-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    startPillLtr:
      "!bg-emerald-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillRtl:
      "!bg-emerald-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillLtr:
      "!bg-emerald-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    singlePill: "!bg-emerald-500/15 rounded-full",
    startClassRtl:
      "!bg-emerald-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-emerald-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    startClassLtr:
      "!bg-emerald-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!bg-emerald-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:shadow-xs",
    endClassRtl:
      "!bg-emerald-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    endClassLtr:
      "!bg-emerald-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
    startClass:
      "!bg-emerald-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-emerald-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    endClass:
      "!bg-emerald-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    singleClass:
      "rounded-full [&>button]:!bg-emerald-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-full [&>button]:shadow-xs",
  },
  {
    id: "purple",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-500/30",
    dotColor: "bg-purple-600",
    accentColor: "#7c3aed",
    rangeClassRtl:
      "!bg-purple-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-purple-500/25",
    rangeClassLtr:
      "!bg-purple-500/15 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-purple-500/25",
    rangeClass:
      "!bg-purple-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-purple-500/25",
    startPillRtl:
      "!bg-purple-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    startPillLtr:
      "!bg-purple-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillRtl:
      "!bg-purple-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillLtr:
      "!bg-purple-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    singlePill: "!bg-purple-500/15 rounded-full",
    startClassRtl:
      "!bg-purple-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-purple-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    startClassLtr:
      "!bg-purple-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!bg-purple-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:shadow-xs",
    endClassRtl:
      "!bg-purple-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    endClassLtr:
      "!bg-purple-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
    startClass:
      "!bg-purple-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-purple-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    endClass:
      "!bg-purple-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    singleClass:
      "rounded-full [&>button]:!bg-purple-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-full [&>button]:shadow-xs",
  },
  {
    id: "amber",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-500/30",
    dotColor: "bg-amber-600",
    accentColor: "#d97706",
    rangeClassRtl:
      "!bg-amber-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-amber-500/25",
    rangeClassLtr:
      "!bg-amber-500/15 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-amber-500/25",
    rangeClass:
      "!bg-amber-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-amber-500/25",
    startPillRtl:
      "!bg-amber-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    startPillLtr:
      "!bg-amber-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillRtl:
      "!bg-amber-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillLtr:
      "!bg-amber-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    singlePill: "!bg-amber-500/15 rounded-full",
    startClassRtl:
      "!bg-amber-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-amber-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    startClassLtr:
      "!bg-amber-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!bg-amber-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:shadow-xs",
    endClassRtl:
      "!bg-amber-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    endClassLtr:
      "!bg-amber-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
    startClass:
      "!bg-amber-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-amber-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    endClass:
      "!bg-amber-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    singleClass:
      "rounded-full [&>button]:!bg-amber-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-full [&>button]:shadow-xs",
  },
  {
    id: "cyan",
    badgeBg: "bg-cyan-500/15",
    badgeText: "text-cyan-700",
    badgeBorder: "border-cyan-500/30",
    dotColor: "bg-cyan-600",
    accentColor: "#0891b2",
    rangeClassRtl:
      "!bg-cyan-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-cyan-500/25",
    rangeClassLtr:
      "!bg-cyan-500/15 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-cyan-500/25",
    rangeClass:
      "!bg-cyan-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-cyan-500/25",
    startPillRtl:
      "!bg-cyan-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    startPillLtr:
      "!bg-cyan-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillRtl:
      "!bg-cyan-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillLtr:
      "!bg-cyan-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    singlePill: "!bg-cyan-500/15 rounded-full",
    startClassRtl:
      "!bg-cyan-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-cyan-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    startClassLtr:
      "!bg-cyan-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!bg-cyan-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:shadow-xs",
    endClassRtl:
      "!bg-cyan-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    endClassLtr:
      "!bg-cyan-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
    startClass:
      "!bg-cyan-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-cyan-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    endClass:
      "!bg-cyan-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    singleClass:
      "rounded-full [&>button]:!bg-cyan-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-full [&>button]:shadow-xs",
  },
  {
    id: "rose",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-700",
    badgeBorder: "border-rose-500/30",
    dotColor: "bg-rose-600",
    accentColor: "#e11d48",
    rangeClassRtl:
      "!bg-rose-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-rose-500/25",
    rangeClassLtr:
      "!bg-rose-500/15 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-rose-500/25",
    rangeClass:
      "!bg-rose-500/15 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-rose-500/25",
    startPillRtl:
      "!bg-rose-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    startPillLtr:
      "!bg-rose-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillRtl:
      "!bg-rose-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
    endPillLtr:
      "!bg-rose-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
    singlePill: "!bg-rose-500/15 rounded-full",
    startClassRtl:
      "!bg-rose-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-rose-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    startClassLtr:
      "!bg-rose-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!bg-rose-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:shadow-xs",
    endClassRtl:
      "!bg-rose-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    endClassLtr:
      "!bg-rose-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
    startClass:
      "!bg-rose-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-rose-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    endClass:
      "!bg-rose-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    singleClass:
      "rounded-full [&>button]:!bg-rose-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-full [&>button]:shadow-xs",
  },
]

export function getTermColorTheme(index: number): TermColorTheme {
  const palette = TERM_COLOR_PALETTES[index % TERM_COLOR_PALETTES.length]
  return palette || TERM_COLOR_PALETTES[0]!
}

export function normalizeDateToYmd(d: Date | string): string {
  if (typeof d === "string") {
    return d.split("T")[0] || ""
  }
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, "0")
  const day = d.getDate().toString().padStart(2, "0")
  return `${y}-${m}-${day}`
}

export interface TermCalendarModifiersResult {
  modifiers: Record<string, (date: Date) => boolean>
  modifiersClassNames: Record<string, string>
}

export function buildTermCalendarModifiers(
  proposals: GeneratedTermProposal[],
  isRtl: boolean = true
): TermCalendarModifiersResult {
  const modifiers: Record<string, (date: Date) => boolean> = {}
  const modifiersClassNames: Record<string, string> = {}

  // 1. Term range, start date, and end date modifiers
  proposals.forEach((term, index) => {
    const theme = getTermColorTheme(index)
    const startYmd = normalizeDateToYmd(term.startDate)
    const endYmd = normalizeDateToYmd(term.endDate)

    const rangeKey = `term_${index}_range`
    const startKey = `term_${index}_start`
    const startPillKey = `term_${index}_start_pill`
    const endKey = `term_${index}_end`
    const endPillKey = `term_${index}_end_pill`

    const isSingleDay = startYmd === endYmd
    const rangeClass = isRtl ? theme.rangeClassRtl : theme.rangeClassLtr
    const startClass = isRtl ? theme.startClassRtl : theme.startClassLtr
    const endClass = isRtl ? theme.endClassRtl : theme.endClassLtr

    // Continuous range bar (light background tint)
    modifiers[rangeKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return ymd >= startYmd && ymd <= endYmd
    }
    modifiersClassNames[rangeKey] = rangeClass

    // Start day container pill curve (applies to container cell even if holiday)
    modifiers[startPillKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return ymd === startYmd
    }
    modifiersClassNames[startPillKey] = isSingleDay
      ? theme.singlePill
      : isRtl
        ? theme.startPillRtl
        : theme.startPillLtr

    // Start day button: filled color button ONLY if NOT a holiday.
    // If holiday, holiday style overrides the button styling.
    modifiers[startKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      if (ymd !== startYmd) return false
      return !isJalaliHoliday(date).isHoliday
    }
    modifiersClassNames[startKey] = isSingleDay ? theme.singleClass : startClass

    // End day container pill curve
    modifiers[endPillKey] = (date: Date) => {
      if (isSingleDay) return false
      const ymd = normalizeDateToYmd(date)
      return ymd === endYmd
    }
    modifiersClassNames[endPillKey] = isRtl
      ? theme.endPillRtl
      : theme.endPillLtr

    // End day button: normal end day typography ONLY if NOT a holiday.
    modifiers[endKey] = (date: Date) => {
      if (isSingleDay) return false
      const ymd = normalizeDateToYmd(date)
      return ymd === endYmd && !isJalaliHoliday(date).isHoliday
    }
    modifiersClassNames[endKey] = isSingleDay ? "" : endClass
  })

  // 2. Off days (Only Fridays that are NOT official holidays)
  modifiers.term_offDay = (date: Date) => {
    const isFriday = isRtl ? date.getDay() === 5 : date.getDay() === 0
    if (!isFriday) return false
    // If Friday is also an official holiday, holiday style overrides Friday style
    return !isJalaliHoliday(date).isHoliday
  }

  modifiersClassNames.term_offDay =
    "[&>button]:!text-destructive [&>button]:!font-bold hover:[&>button]:!bg-destructive/15"

  // 3. Official Jalali holidays (Red text and small red dot below day number, no border)
  // Overrides Friday style, range day style, and start/end day button style
  modifiers.term_officialHoliday = (date: Date) => {
    return isJalaliHoliday(date).isHoliday
  }

  modifiersClassNames.term_officialHoliday =
    "[&>button]:!text-destructive [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-destructive hover:[&>button]:!bg-destructive/15 [&>button]:!bg-transparent"

  return { modifiers, modifiersClassNames }
}
