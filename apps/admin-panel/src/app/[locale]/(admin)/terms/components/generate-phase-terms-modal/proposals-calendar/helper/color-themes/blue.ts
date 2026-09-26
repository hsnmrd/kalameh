import type { TermColorTheme } from "../term-color-theme"

export const BLUE_TERM_THEME: TermColorTheme = {
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
    "!bg-blue-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none last:!rounded-full first:rounded-tr-full first:rounded-br-full",
  startPillLtr:
    "!bg-blue-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none last:!rounded-full first:rounded-tl-full first:rounded-bl-full",
  endPillRtl:
    "!bg-blue-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none first:!rounded-tl-full first:!rounded-bl-full first:!rounded-tr-none first:!rounded-br-none last:!rounded-tl-full last:!rounded-bl-full last:!rounded-tr-none last:!rounded-br-none",
  endPillLtr:
    "!bg-blue-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none first:!rounded-tr-full first:!rounded-br-full first:!rounded-tl-none first:!rounded-bl-none last:!rounded-tr-full last:!rounded-br-full last:!rounded-tl-none last:!rounded-bl-none",
  singlePill: "!bg-blue-500/15 rounded-full",
  startClassRtl:
    "!bg-blue-600/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none last:!rounded-full first:rounded-tr-full first:rounded-br-full [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none last:[&>button]:!rounded-full first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full [&>button]:shadow-xs",
  startClassLtr:
    "!bg-blue-600/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none last:!rounded-full first:rounded-tl-full first:rounded-bl-full [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none last:[&>button]:!rounded-full first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full [&>button]:shadow-xs",
  startClass:
    "!bg-blue-600/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none last:!rounded-full first:rounded-tr-full first:rounded-br-full [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none last:[&>button]:!rounded-full first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full [&>button]:shadow-xs",
  endClassRtl:
    "!bg-blue-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none first:!rounded-tl-full first:!rounded-bl-full first:!rounded-tr-none first:!rounded-br-none last:!rounded-tl-full last:!rounded-bl-full last:!rounded-tr-none last:!rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full first:[&>button]:!rounded-tr-none first:[&>button]:!rounded-br-none last:[&>button]:!rounded-tl-full last:[&>button]:!rounded-bl-full last:[&>button]:!rounded-tr-none last:[&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
  endClassLtr:
    "!bg-blue-500/15 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none first:!rounded-tr-full first:!rounded-br-full first:!rounded-tl-none first:!rounded-bl-none last:!rounded-tr-full last:!rounded-br-full last:!rounded-tl-none last:!rounded-bl-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full first:[&>button]:!rounded-tl-none first:[&>button]:!rounded-bl-none last:[&>button]:!rounded-tr-full last:[&>button]:!rounded-br-full last:[&>button]:!rounded-tl-none last:[&>button]:!rounded-bl-none [&>button]:!font-bold [&>button]:text-foreground",
  endClass:
    "!bg-blue-500/15 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none first:!rounded-tl-full first:!rounded-bl-full first:!rounded-tr-none first:!rounded-br-none last:!rounded-tl-full last:!rounded-bl-full last:!rounded-tr-none last:!rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full first:[&>button]:!rounded-tr-none first:[&>button]:!rounded-br-none last:[&>button]:!rounded-tl-full last:[&>button]:!rounded-bl-full last:[&>button]:!rounded-tr-none last:[&>button]:!rounded-br-none [&>button]:!font-bold [&>button]:text-foreground",
  singleClass:
    "rounded-full [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!font-bold [&>button]:!rounded-full [&>button]:shadow-xs",
}
