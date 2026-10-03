import type { TermColorTheme } from "../term-color-theme"

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
    "!bg-muted/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none last:!rounded-full first:rounded-tr-full first:rounded-br-full",
  startPillLtr:
    "!bg-muted/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none last:!rounded-full first:rounded-tl-full first:rounded-bl-full",
  endPillRtl:
    "!bg-muted/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none first:!rounded-tl-full first:!rounded-bl-full first:!rounded-tr-none first:!rounded-br-none last:!rounded-tl-full last:!rounded-bl-full last:!rounded-tr-none last:!rounded-br-none",
  endPillLtr:
    "!bg-muted/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none first:!rounded-tr-full first:!rounded-br-full first:!rounded-tl-none first:!rounded-bl-none last:!rounded-tr-full last:!rounded-br-full last:!rounded-tl-none last:!rounded-br-none",
  singlePill: "!bg-muted/25 rounded-full",
  startClassRtl:
    "!bg-muted/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none last:!rounded-full first:rounded-tr-full first:rounded-br-full [&>button]:!bg-muted [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none last:[&>button]:!rounded-full first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full",
  startClassLtr:
    "!bg-muted/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none last:!rounded-full first:rounded-tl-full first:rounded-bl-full [&>button]:!bg-muted [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none last:[&>button]:!rounded-full first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full",
  startClass:
    "!bg-muted/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none last:!rounded-full first:rounded-tr-full first:rounded-br-full [&>button]:!bg-muted [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none last:[&>button]:!rounded-full first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full",
  endClassRtl:
    "!bg-muted/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none first:!rounded-tl-full first:!rounded-bl-full first:!rounded-tr-none first:!rounded-br-none last:!rounded-tl-full last:!rounded-bl-full last:!rounded-tr-none last:!rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full first:[&>button]:!rounded-tr-none first:[&>button]:!rounded-br-none last:[&>button]:!rounded-tl-full last:[&>button]:!rounded-bl-full last:[&>button]:!rounded-tr-none last:[&>button]:!rounded-br-none [&>button]:!font-medium [&>button]:!text-muted-foreground",
  endClassLtr:
    "!bg-muted/25 rounded-tr-full rounded-br-full rounded-tl-none rounded-bl-none first:!rounded-tr-full first:!rounded-br-full first:!rounded-tl-none first:!rounded-bl-none last:!rounded-tr-full last:!rounded-br-full last:!rounded-tl-none last:!rounded-br-none [&>button]:!rounded-tr-full [&>button]:!rounded-br-full [&>button]:!rounded-tl-none [&>button]:!rounded-bl-none first:[&>button]:!rounded-tr-full first:[&>button]:!rounded-br-full first:[&>button]:!rounded-tl-none first:[&>button]:!rounded-bl-none last:[&>button]:!rounded-tr-full last:[&>button]:!rounded-br-full last:[&>button]:!rounded-tl-none last:[&>button]:!rounded-bl-none [&>button]:!font-medium [&>button]:!text-muted-foreground",
  endClass:
    "!bg-muted/25 rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none first:!rounded-tl-full first:!rounded-bl-full first:!rounded-tr-none first:!rounded-br-none last:!rounded-tl-full last:!rounded-bl-full last:!rounded-tr-none last:!rounded-br-none [&>button]:!rounded-tl-full [&>button]:!rounded-bl-full [&>button]:!rounded-tr-none [&>button]:!rounded-br-none first:[&>button]:!rounded-tl-full first:[&>button]:!rounded-bl-full first:[&>button]:!rounded-tr-none first:[&>button]:!rounded-br-none last:[&>button]:!rounded-tl-full last:[&>button]:!rounded-bl-full last:[&>button]:!rounded-tr-none last:[&>button]:!rounded-br-none [&>button]:!font-medium [&>button]:!text-muted-foreground",
  singleClass:
    "rounded-full [&>button]:!bg-muted [&>button]:!text-muted-foreground [&>button]:!font-medium [&>button]:!rounded-full",
}
