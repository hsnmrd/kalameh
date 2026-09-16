import {
  isJalaliHoliday,
  type GeneratedTermProposal,
  type CompensatorySession,
} from "@workspace/types"

export interface TermColorTheme {
  id: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  dotColor: string
  accentColor: string
  evenColorHex: string
  oddColorHex: string
  rangeClassRtl: string
  rangeClassLtr: string
  rangeClass: string
  evenSessionClassRtl: string
  evenSessionClassLtr: string
  evenSessionClass: string
  oddSessionClassRtl: string
  oddSessionClassLtr: string
  oddSessionClass: string
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
    evenColorHex: "rgba(37, 99, 235, 0.35)",
    oddColorHex: "rgba(37, 99, 235, 0.14)",
    rangeClassRtl:
      "!bg-blue-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-blue-500/15",
    rangeClassLtr:
      "!bg-blue-500/8 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-blue-500/15",
    rangeClass:
      "!bg-blue-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-blue-500/15",
    evenSessionClassRtl:
      "!bg-blue-600/25 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-blue-600/35",
    evenSessionClassLtr:
      "!bg-blue-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-blue-600/35",
    evenSessionClass:
      "!bg-blue-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-blue-600/35",
    oddSessionClassRtl:
      "!bg-blue-400/12 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-blue-400/20",
    oddSessionClassLtr:
      "!bg-blue-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-blue-400/20",
    oddSessionClass:
      "!bg-blue-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-blue-400/20",
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
      "!bg-blue-600/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    startClassLtr:
      "!bg-blue-600/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:shadow-xs",
    startClass:
      "!bg-blue-600/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    endClassRtl:
      "!bg-blue-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    endClassLtr:
      "!bg-blue-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
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
    evenColorHex: "rgba(5, 150, 105, 0.35)",
    oddColorHex: "rgba(5, 150, 105, 0.14)",
    rangeClassRtl:
      "!bg-emerald-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-emerald-500/15",
    rangeClassLtr:
      "!bg-emerald-500/8 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-emerald-500/15",
    rangeClass:
      "!bg-emerald-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-emerald-500/15",
    evenSessionClassRtl:
      "!bg-emerald-600/25 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-emerald-600/35",
    evenSessionClassLtr:
      "!bg-emerald-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-emerald-600/35",
    evenSessionClass:
      "!bg-emerald-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-emerald-600/35",
    oddSessionClassRtl:
      "!bg-emerald-400/12 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-emerald-400/20",
    oddSessionClassLtr:
      "!bg-emerald-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-emerald-400/20",
    oddSessionClass:
      "!bg-emerald-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-emerald-400/20",
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
      "!bg-emerald-600/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-emerald-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    startClassLtr:
      "!bg-emerald-600/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!bg-emerald-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:shadow-xs",
    startClass:
      "!bg-emerald-600/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-emerald-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    endClassRtl:
      "!bg-emerald-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    endClassLtr:
      "!bg-emerald-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
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
    evenColorHex: "rgba(124, 58, 237, 0.35)",
    oddColorHex: "rgba(124, 58, 237, 0.14)",
    rangeClassRtl:
      "!bg-purple-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-purple-500/15",
    rangeClassLtr:
      "!bg-purple-500/8 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-purple-500/15",
    rangeClass:
      "!bg-purple-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-purple-500/15",
    evenSessionClassRtl:
      "!bg-purple-600/25 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-purple-600/35",
    evenSessionClassLtr:
      "!bg-purple-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-purple-600/35",
    evenSessionClass:
      "!bg-purple-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-purple-600/35",
    oddSessionClassRtl:
      "!bg-purple-400/12 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-purple-400/20",
    oddSessionClassLtr:
      "!bg-purple-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-purple-400/20",
    oddSessionClass:
      "!bg-purple-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-purple-400/20",
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
      "!bg-purple-600/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-purple-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    startClassLtr:
      "!bg-purple-600/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!bg-purple-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:shadow-xs",
    startClass:
      "!bg-purple-600/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-purple-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    endClassRtl:
      "!bg-purple-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    endClassLtr:
      "!bg-purple-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
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
    evenColorHex: "rgba(217, 119, 6, 0.35)",
    oddColorHex: "rgba(217, 119, 6, 0.14)",
    rangeClassRtl:
      "!bg-amber-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-amber-500/15",
    rangeClassLtr:
      "!bg-amber-500/8 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-amber-500/15",
    rangeClass:
      "!bg-amber-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-amber-500/15",
    evenSessionClassRtl:
      "!bg-amber-600/25 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-amber-600/35",
    evenSessionClassLtr:
      "!bg-amber-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-amber-600/35",
    evenSessionClass:
      "!bg-amber-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-amber-600/35",
    oddSessionClassRtl:
      "!bg-amber-400/12 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-amber-400/20",
    oddSessionClassLtr:
      "!bg-amber-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-amber-400/20",
    oddSessionClass:
      "!bg-amber-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-amber-400/20",
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
      "!bg-amber-600/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-amber-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    startClassLtr:
      "!bg-amber-600/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!bg-amber-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:shadow-xs",
    startClass:
      "!bg-amber-600/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-amber-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    endClassRtl:
      "!bg-amber-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    endClassLtr:
      "!bg-amber-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
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
    evenColorHex: "rgba(8, 145, 178, 0.35)",
    oddColorHex: "rgba(8, 145, 178, 0.14)",
    rangeClassRtl:
      "!bg-cyan-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-cyan-500/15",
    rangeClassLtr:
      "!bg-cyan-500/8 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-cyan-500/15",
    rangeClass:
      "!bg-cyan-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-cyan-500/15",
    evenSessionClassRtl:
      "!bg-cyan-600/25 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-cyan-600/35",
    evenSessionClassLtr:
      "!bg-cyan-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-cyan-600/35",
    evenSessionClass:
      "!bg-cyan-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-cyan-600/35",
    oddSessionClassRtl:
      "!bg-cyan-400/12 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-cyan-400/20",
    oddSessionClassLtr:
      "!bg-cyan-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-cyan-400/20",
    oddSessionClass:
      "!bg-cyan-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-cyan-400/20",
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
      "!bg-cyan-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-br-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
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
    evenColorHex: "rgba(225, 29, 72, 0.35)",
    oddColorHex: "rgba(225, 29, 72, 0.14)",
    rangeClassRtl:
      "!bg-rose-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-rose-500/15",
    rangeClassLtr:
      "!bg-rose-500/8 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:hover:!bg-rose-500/15",
    rangeClass:
      "!bg-rose-500/8 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:hover:!bg-rose-500/15",
    evenSessionClassRtl:
      "!bg-rose-600/25 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-rose-600/35",
    evenSessionClassLtr:
      "!bg-rose-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-rose-600/35",
    evenSessionClass:
      "!bg-rose-600/25 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-bold [&>button]:hover:!bg-rose-600/35",
    oddSessionClassRtl:
      "!bg-rose-400/12 text-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-rose-400/20",
    oddSessionClassLtr:
      "!bg-rose-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-rose-400/20",
    oddSessionClass:
      "!bg-rose-400/12 text-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:hover:!bg-rose-400/20",
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
      "!bg-rose-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-br-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
    startClass:
      "!bg-rose-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-rose-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:shadow-xs",
    endClass:
      "!bg-rose-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
    singleClass:
      "rounded-full [&>button]:!bg-rose-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-full [&>button]:shadow-xs",
  },
]

export const DIMMED_TERM_COLOR_THEME: TermColorTheme = {
  id: "dimmed",
  badgeBg: "bg-muted/40",
  badgeText: "text-muted-foreground",
  badgeBorder: "border-border",
  dotColor: "bg-muted-foreground/50",
  accentColor: "var(--muted-foreground)",
  evenColorHex: "rgba(148, 163, 184, 0.25)",
  oddColorHex: "rgba(148, 163, 184, 0.12)",
  rangeClassRtl:
    "!bg-muted/10 text-muted-foreground/50 first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!text-muted-foreground/50 [&>button]:hover:!bg-muted/20",
  rangeClassLtr:
    "!bg-muted/10 text-muted-foreground/50 first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!text-muted-foreground/50 [&>button]:hover:!bg-muted/20",
  rangeClass:
    "!bg-muted/10 text-muted-foreground/50 first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!text-muted-foreground/50 [&>button]:hover:!bg-muted/20",
  evenSessionClassRtl:
    "!bg-muted/40 text-muted-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:!text-muted-foreground [&>button]:hover:!bg-muted/55",
  evenSessionClassLtr:
    "!bg-muted/40 text-muted-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:!text-muted-foreground [&>button]:hover:!bg-muted/55",
  evenSessionClass:
    "!bg-muted/40 text-muted-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-medium [&>button]:!text-muted-foreground [&>button]:hover:!bg-muted/55",
  oddSessionClassRtl:
    "!bg-muted/20 text-muted-foreground/75 first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!font-normal [&>button]:!text-muted-foreground/75 [&>button]:hover:!bg-muted/30",
  oddSessionClassLtr:
    "!bg-muted/20 text-muted-foreground/75 first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-normal [&>button]:!text-muted-foreground/75 [&>button]:hover:!bg-muted/30",
  oddSessionClass:
    "!bg-muted/20 text-muted-foreground/75 first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!font-normal [&>button]:!text-muted-foreground/75 [&>button]:hover:!bg-muted/30",
  startPillRtl:
    "!bg-muted/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
  startPillLtr:
    "!bg-muted/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
  endPillRtl:
    "!bg-muted/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none",
  endPillLtr:
    "!bg-muted/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none",
  singlePill: "!bg-muted/25 rounded-full",
  startClassRtl:
    "!bg-muted/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-muted [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none",
  startClassLtr:
    "!bg-muted/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!bg-muted [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none",
  startClass:
    "!bg-muted/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!bg-muted [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none",
  endClassRtl:
    "!bg-muted/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-medium [&>button]:!text-muted-foreground",
  endClassLtr:
    "!bg-muted/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none [&>button]:!font-medium [&>button]:!text-muted-foreground",
  endClass:
    "!bg-muted/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none [&>button]:!font-medium [&>button]:!text-muted-foreground",
  singleClass:
    "rounded-full [&>button]:!bg-muted [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:!rounded-full",
}

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

export interface BuildTermCalendarModifiersOptions {
  observeOfficialHolidays?: boolean
  customOffDays?: string[]
  dismissedHolidays?: string[]
  compensatorySessions?: Record<number, CompensatorySession[]>
  selectedTermIndex?: number
}

export function buildTermCalendarModifiers(
  proposals: GeneratedTermProposal[],
  isRtl: boolean = true,
  options?: BuildTermCalendarModifiersOptions
): TermCalendarModifiersResult {
  const {
    observeOfficialHolidays = true,
    customOffDays = [],
    dismissedHolidays = [],
    compensatorySessions = {},
    selectedTermIndex,
  } = options ?? {}
  const customOffDaysSet = new Set(customOffDays)
  const dismissedHolidaysSet = new Set(dismissedHolidays)

  const allCompensatoryDatesSet = new Set(
    Object.values(compensatorySessions).flatMap((list) =>
      list.map((cs) => cs.date)
    )
  )

  const activeCompensatoryDatesSet = new Set(
    selectedTermIndex !== undefined
      ? (compensatorySessions[selectedTermIndex] ?? []).map((cs) => cs.date)
      : Object.values(compensatorySessions).flatMap((list) =>
          list.map((cs) => cs.date)
        )
  )

  const activeExcessDatesSet = new Set(
    selectedTermIndex !== undefined && proposals[selectedTermIndex]
      ? (proposals[selectedTermIndex].patternDetails ?? []).flatMap(
          (pd) => pd.excessDates ?? []
        )
      : proposals.flatMap((term) =>
          (term.patternDetails ?? []).flatMap((pd) => pd.excessDates ?? [])
        )
  )

  const isDateAnOffDay = (date: Date): boolean => {
    const ymd = normalizeDateToYmd(date)
    if (customOffDaysSet.has(ymd)) return true
    if (
      observeOfficialHolidays &&
      isJalaliHoliday(date).isHoliday &&
      !dismissedHolidaysSet.has(ymd)
    ) {
      return true
    }
    return false
  }

  const modifiers: Record<string, (date: Date) => boolean> = {}
  const modifiersClassNames: Record<string, string> = {}

  // 1. Term range, start date, and end date modifiers
  proposals.forEach((term, index) => {
    const isSelected =
      selectedTermIndex === undefined || selectedTermIndex === index
    const theme = isSelected
      ? getTermColorTheme(index)
      : DIMMED_TERM_COLOR_THEME
    const startYmd = normalizeDateToYmd(term.startDate)
    const endYmd = normalizeDateToYmd(term.endDate)

    const evenPattern = term.patternDetails?.find((p) => p.track === "EVEN")
    const oddPattern = term.patternDetails?.find((p) => p.track === "ODD")

    const evenDates = new Set<string>()
    const oddDates = new Set<string>()

    if (evenPattern?.sessionDates && evenPattern.sessionDates.length > 0) {
      evenPattern.sessionDates.forEach((d) => evenDates.add(d))
    }
    if (oddPattern?.sessionDates && oddPattern.sessionDates.length > 0) {
      oddPattern.sessionDates.forEach((d) => oddDates.add(d))
    }

    const termCompensatories = compensatorySessions[index] ?? []
    termCompensatories.forEach((cs) => {
      if (cs.patternTrack === "EVEN") {
        evenDates.add(cs.date)
      } else if (cs.patternTrack === "ODD") {
        oddDates.add(cs.date)
      }
    })

    // Fallback if proposal has no patternDetails (e.g. basic mock data)
    if (evenDates.size === 0 && oddDates.size === 0) {
      let curr = new Date(term.startDate)
      const endD = new Date(term.endDate)
      while (curr <= endD) {
        const ymd = normalizeDateToYmd(curr)
        if (!isDateAnOffDay(curr)) {
          const dayOfWeek = curr.getDay()
          if (dayOfWeek === 6 || dayOfWeek === 1 || dayOfWeek === 3) {
            evenDates.add(ymd)
          } else if (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4) {
            oddDates.add(ymd)
          }
        }
        curr = new Date(curr.getTime() + 24 * 60 * 60 * 1000)
      }
    }

    const rangeKey = `term_${index}_range`
    const startKey = `term_${index}_start`
    const startPillKey = `term_${index}_start_pill`
    const endKey = `term_${index}_end`
    const endPillKey = `term_${index}_end_pill`
    const evenSessionKey = `term_${index}_even_session`
    const oddSessionKey = `term_${index}_odd_session`

    const isSingleDay = startYmd === endYmd
    const rangeClass = isRtl ? theme.rangeClassRtl : theme.rangeClassLtr
    const evenSessionClass = isRtl
      ? theme.evenSessionClassRtl
      : theme.evenSessionClassLtr
    const oddSessionClass = isRtl
      ? theme.oddSessionClassRtl
      : theme.oddSessionClassLtr
    const startClass = isRtl ? theme.startClassRtl : theme.startClassLtr
    const endClass = isRtl ? theme.endClassRtl : theme.endClassLtr

    // 1a. Even session days
    modifiers[evenSessionKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      if (isDateAnOffDay(date) && !allCompensatoryDatesSet.has(ymd))
        return false
      return evenDates.has(ymd)
    }
    modifiersClassNames[evenSessionKey] = evenSessionClass

    // 1b. Odd session days
    modifiers[oddSessionKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      if (isDateAnOffDay(date) && !allCompensatoryDatesSet.has(ymd))
        return false
      return oddDates.has(ymd)
    }
    modifiersClassNames[oddSessionKey] = oddSessionClass

    // 1c. Continuous range bar (light background tint for non-session days inside term)
    modifiers[rangeKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      if (ymd < startYmd || ymd > endYmd) return false
      if (evenDates.has(ymd) || oddDates.has(ymd)) return false
      if (isDateAnOffDay(date)) return false
      const isFriday = isRtl ? date.getDay() === 5 : date.getDay() === 0
      if (isFriday) return false
      return true
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

    // Start day button: filled color button ONLY if NOT an off day / holiday.
    // If off day / holiday, off-day style overrides the button styling.
    modifiers[startKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      if (ymd !== startYmd) return false
      return !isDateAnOffDay(date)
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

    // End day button: normal end day typography ONLY if NOT an off day / holiday.
    modifiers[endKey] = (date: Date) => {
      if (isSingleDay) return false
      const ymd = normalizeDateToYmd(date)
      return ymd === endYmd && !isDateAnOffDay(date)
    }
    modifiersClassNames[endKey] = isSingleDay ? "" : endClass

    // 1d. Holidays inside this specific term
    if (observeOfficialHolidays) {
      const termHolidayKey = `term_${index}_holiday`
      modifiers[termHolidayKey] = (date: Date) => {
        const ymd = normalizeDateToYmd(date)
        if (ymd < startYmd || ymd > endYmd) return false
        if (allCompensatoryDatesSet.has(ymd)) return false
        return isJalaliHoliday(date).isHoliday && !dismissedHolidaysSet.has(ymd)
      }

      const activeHolidayClassRtl =
        "!bg-destructive/15 text-destructive first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-destructive/15 [&>button]:!text-destructive [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-destructive hover:[&>button]:!bg-destructive/25"
      const activeHolidayClassLtr =
        "!bg-destructive/15 text-destructive first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-destructive/15 [&>button]:!text-destructive [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-destructive hover:[&>button]:!bg-destructive/25"

      const dimmedHolidayClassRtl =
        "!bg-muted/30 text-muted-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-muted/30 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/50"
      const dimmedHolidayClassLtr =
        "!bg-muted/30 text-muted-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-muted/30 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/50"

      modifiersClassNames[termHolidayKey] = isSelected
        ? isRtl
          ? activeHolidayClassRtl
          : activeHolidayClassLtr
        : isRtl
          ? dimmedHolidayClassRtl
          : dimmedHolidayClassLtr
    }

    // 1e. Fridays inside this specific term
    const termOffDayKey = `term_${index}_offDay`
    modifiers[termOffDayKey] = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      if (ymd < startYmd || ymd > endYmd) return false
      const isFriday = isRtl ? date.getDay() === 5 : date.getDay() === 0
      if (!isFriday) return false
      if (allCompensatoryDatesSet.has(ymd)) return false
      return !isDateAnOffDay(date)
    }

    const activeOffDayClassRtl =
      "!bg-destructive/15 text-destructive first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-destructive/15 [&>button]:!text-destructive [&>button]:!font-bold hover:[&>button]:!bg-destructive/25"
    const activeOffDayClassLtr =
      "!bg-destructive/15 text-destructive first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-destructive/15 [&>button]:!text-destructive [&>button]:!font-bold hover:[&>button]:!bg-destructive/25"

    const dimmedOffDayClassRtl =
      "!bg-muted/30 text-muted-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-muted/30 [&>button]:!text-muted-foreground [&>button]:!font-medium hover:[&>button]:!bg-muted/50"
    const dimmedOffDayClassLtr =
      "!bg-muted/30 text-muted-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-muted/30 [&>button]:!text-muted-foreground [&>button]:!font-medium hover:[&>button]:!bg-muted/50"

    modifiersClassNames[termOffDayKey] = isSelected
      ? isRtl
        ? activeOffDayClassRtl
        : activeOffDayClassLtr
      : isRtl
        ? dimmedOffDayClassRtl
        : dimmedOffDayClassLtr

    // 1f. Custom off-days inside this specific term
    if (customOffDaysSet.size > 0) {
      const termCustomKey = `term_${index}_customOffDay`
      modifiers[termCustomKey] = (date: Date) => {
        const ymd = normalizeDateToYmd(date)
        if (ymd < startYmd || ymd > endYmd) return false
        return customOffDaysSet.has(ymd)
      }

      const activeCustomClassRtl =
        "!bg-warning/15 text-warning first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-warning/15 [&>button]:!text-warning [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-warning hover:[&>button]:!bg-warning/25"
      const activeCustomClassLtr =
        "!bg-warning/15 text-warning first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-warning/15 [&>button]:!text-warning [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-warning hover:[&>button]:!bg-warning/25"

      const dimmedCustomClassRtl =
        "!bg-muted/25 text-muted-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-muted/25 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/40"
      const dimmedCustomClassLtr =
        "!bg-muted/25 text-muted-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-muted/25 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/40"

      modifiersClassNames[termCustomKey] = isSelected
        ? isRtl
          ? activeCustomClassRtl
          : activeCustomClassLtr
        : isRtl
          ? dimmedCustomClassRtl
          : dimmedCustomClassLtr
    }

    // 1g. Dismissed holidays inside this specific term
    if (observeOfficialHolidays && dismissedHolidaysSet.size > 0) {
      const termDismissedKey = `term_${index}_dismissedHoliday`
      modifiers[termDismissedKey] = (date: Date) => {
        const ymd = normalizeDateToYmd(date)
        if (ymd < startYmd || ymd > endYmd) return false
        return isJalaliHoliday(date).isHoliday && dismissedHolidaysSet.has(ymd)
      }

      const activeDismissedClassRtl =
        "!bg-emerald-500/15 text-emerald-700 first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-emerald-500/15 [&>button]:!text-emerald-700 [&>button]:!font-semibold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-emerald-600 hover:[&>button]:!bg-emerald-500/25"
      const activeDismissedClassLtr =
        "!bg-emerald-500/15 text-emerald-700 first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-emerald-500/15 [&>button]:!text-emerald-700 [&>button]:!font-semibold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-emerald-600 hover:[&>button]:!bg-emerald-500/25"

      const dimmedDismissedClassRtl =
        "!bg-muted/25 text-muted-foreground first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none [&>button]:!rounded-none [&>button]:!bg-muted/25 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/40"
      const dimmedDismissedClassLtr =
        "!bg-muted/25 text-muted-foreground first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none [&>button]:!rounded-none [&>button]:!bg-muted/25 [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:!bg-muted-foreground/50 hover:[&>button]:!bg-muted/40"

      modifiersClassNames[termDismissedKey] = isSelected
        ? isRtl
          ? activeDismissedClassRtl
          : activeDismissedClassLtr
        : isRtl
          ? dimmedDismissedClassRtl
          : dimmedDismissedClassLtr
    }
  })

  // 2. Off days (Only Fridays that are NOT holidays or custom off-days)
  // When outside any term: simple and colorless background so they don't attract attention
  modifiers.term_offDay = (date: Date) => {
    const isFriday = isRtl ? date.getDay() === 5 : date.getDay() === 0
    if (!isFriday) return false
    return !isDateAnOffDay(date)
  }

  modifiersClassNames.term_offDay =
    "[&>button]:!text-destructive [&>button]:!font-bold [&>button]:!bg-transparent hover:[&>button]:!bg-muted/20"

  // 3. Official Jalali holidays (When outside any term: simple and colorless background so they don't attract attention)
  if (observeOfficialHolidays) {
    modifiers.term_officialHoliday = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return isJalaliHoliday(date).isHoliday && !dismissedHolidaysSet.has(ymd)
    }

    modifiersClassNames.term_officialHoliday =
      "[&>button]:!text-destructive [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-destructive [&>button]:!bg-transparent hover:[&>button]:!bg-muted/20"

    modifiers.term_dismissedHoliday = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return isJalaliHoliday(date).isHoliday && dismissedHolidaysSet.has(ymd)
    }

    modifiersClassNames.term_dismissedHoliday =
      "[&>button]:!text-emerald-700 [&>button]:!font-semibold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-emerald-600 [&>button]:!bg-transparent hover:[&>button]:!bg-muted/20"
  }

  // 4. Custom institute off-days (When outside any term: simple and colorless background so they don't attract attention)
  if (customOffDaysSet.size > 0) {
    modifiers.term_customOffDay = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return customOffDaysSet.has(ymd)
    }

    modifiersClassNames.term_customOffDay =
      "[&>button]:!text-warning [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-warning [&>button]:!bg-transparent hover:[&>button]:!bg-muted/20"
  }

  // Helper: check if a date should have rounded start cap (Saturday in RTL / Sunday in LTR, or term start date)
  const selectedTerm =
    selectedTermIndex !== undefined ? proposals[selectedTermIndex] : null
  const selStartYmd = selectedTerm?.startDate
    ? normalizeDateToYmd(selectedTerm.startDate)
    : ""
  const selEndYmd = selectedTerm?.endDate
    ? normalizeDateToYmd(selectedTerm.endDate)
    : ""

  const isDayStartSide = (date: Date): boolean => {
    const ymd = normalizeDateToYmd(date)
    if (isRtl) {
      return date.getDay() === 6 || (!!selStartYmd && ymd === selStartYmd)
    }
    return date.getDay() === 0 || (!!selStartYmd && ymd === selStartYmd)
  }

  const isDayEndSide = (date: Date): boolean => {
    const ymd = normalizeDateToYmd(date)
    if (isRtl) {
      return date.getDay() === 5 || (!!selEndYmd && ymd === selEndYmd)
    }
    return date.getDay() === 6 || (!!selEndYmd && ymd === selEndYmd)
  }

  // 5. Compensatory sessions (primary border and primary dot) - ONLY for the selected term
  if (activeCompensatoryDatesSet.size > 0) {
    const isCompensatory = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return activeCompensatoryDatesSet.has(ymd)
    }

    modifiers.term_compensatory = isCompensatory

    const compBase =
      "[&>button]:!border-2 [&>button]:!border-primary [&>button]:!font-bold [&>button]:relative [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-0.5 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1.5 [&>button]:after:rounded-full [&>button]:after:bg-primary hover:[&>button]:!bg-primary/15"

    const compRtlRowFallback =
      "first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full first:[&>button]:!rounded-tl-none first:[&>button]:!rounded-bl-none last:[&>button]:!rounded-tl-full last:[&>button]:!rounded-bl-full last:[&>button]:!rounded-tr-none last:[&>button]:!rounded-br-none"
    const compLtrRowFallback =
      "first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full first:[&>button]:!rounded-tr-none first:[&>button]:!rounded-br-none last:[&>button]:!rounded-tr-full last:[&>button]:!rounded-br-full last:[&>button]:!rounded-tl-none last:[&>button]:!rounded-bl-none"

    modifiersClassNames.term_compensatory = `${compBase} ${isRtl ? compRtlRowFallback : compLtrRowFallback}`

    // Precise radius modifiers matching day pill boundaries
    modifiers.term_compensatory_both = (date: Date) => {
      if (!isCompensatory(date)) return false
      return isDayStartSide(date) && isDayEndSide(date)
    }
    modifiersClassNames.term_compensatory_both =
      "rounded-full [&>button]:!rounded-full"

    modifiers.term_compensatory_start = (date: Date) => {
      if (!isCompensatory(date)) return false
      return isDayStartSide(date) && !isDayEndSide(date)
    }
    modifiersClassNames.term_compensatory_start = isRtl
      ? "rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none"
      : "rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none"

    modifiers.term_compensatory_end = (date: Date) => {
      if (!isCompensatory(date)) return false
      return !isDayStartSide(date) && isDayEndSide(date)
    }
    modifiersClassNames.term_compensatory_end = isRtl
      ? "rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none"
      : "rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none"

    modifiers.term_compensatory_none = (date: Date) => {
      if (!isCompensatory(date)) return false
      return !isDayStartSide(date) && !isDayEndSide(date)
    }
    modifiersClassNames.term_compensatory_none =
      "rounded-none [&>button]:!rounded-none"
  }

  // 6. Excess sessions (Warning/amber dashed border for days exceeding target count) - ONLY for the selected term
  if (activeExcessDatesSet.size > 0) {
    const isExcess = (date: Date) => {
      const ymd = normalizeDateToYmd(date)
      return (
        activeExcessDatesSet.has(ymd) && !activeCompensatoryDatesSet.has(ymd)
      )
    }

    modifiers.term_excessSession = isExcess

    const excessBase =
      "[&>button]:!border-2 [&>button]:!border-dashed [&>button]:!border-warning/80 [&>button]:!text-warning [&>button]:!font-bold hover:[&>button]:!bg-warning/15"

    const excessRtlRowFallback =
      "first:rounded-tr-full first:rounded-br-full first:rounded-tl-none first:rounded-bl-none last:rounded-tl-full last:rounded-bl-full last:rounded-tr-none last:rounded-br-none first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full first:[&>button]:!rounded-tl-none first:[&>button]:!rounded-bl-none last:[&>button]:!rounded-tl-full last:[&>button]:!rounded-bl-full last:[&>button]:!rounded-tr-none last:[&>button]:!rounded-br-none"
    const excessLtrRowFallback =
      "first:rounded-tl-full first:rounded-bl-full first:rounded-tr-none first:rounded-br-none last:rounded-tr-full last:rounded-br-full last:rounded-tl-none last:rounded-bl-none first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full first:[&>button]:!rounded-tr-none first:[&>button]:!rounded-br-none last:[&>button]:!rounded-tr-full last:[&>button]:!rounded-br-full last:[&>button]:!rounded-tl-none last:[&>button]:!rounded-bl-none"

    modifiersClassNames.term_excessSession = `${excessBase} ${isRtl ? excessRtlRowFallback : excessLtrRowFallback}`

    // Precise radius modifiers matching day pill boundaries
    modifiers.term_excessSession_both = (date: Date) => {
      if (!isExcess(date)) return false
      return isDayStartSide(date) && isDayEndSide(date)
    }
    modifiersClassNames.term_excessSession_both =
      "rounded-full [&>button]:!rounded-full"

    modifiers.term_excessSession_start = (date: Date) => {
      if (!isExcess(date)) return false
      return isDayStartSide(date) && !isDayEndSide(date)
    }
    modifiersClassNames.term_excessSession_start = isRtl
      ? "rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none"
      : "rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none"

    modifiers.term_excessSession_end = (date: Date) => {
      if (!isExcess(date)) return false
      return !isDayStartSide(date) && isDayEndSide(date)
    }
    modifiersClassNames.term_excessSession_end = isRtl
      ? "rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none"
      : "rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none"

    modifiers.term_excessSession_none = (date: Date) => {
      if (!isExcess(date)) return false
      return !isDayStartSide(date) && !isDayEndSide(date)
    }
    modifiersClassNames.term_excessSession_none =
      "rounded-none [&>button]:!rounded-none"
  }

  return { modifiers, modifiersClassNames }
}
