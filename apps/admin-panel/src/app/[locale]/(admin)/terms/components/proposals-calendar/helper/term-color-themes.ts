import type { TermColorTheme } from "./term-color-theme"
import { BLUE_TERM_THEME } from "./color-themes/blue"
import { EMERALD_TERM_THEME } from "./color-themes/emerald"
import { PURPLE_TERM_THEME } from "./color-themes/purple"
import { AMBER_TERM_THEME } from "./color-themes/amber"
import { CYAN_TERM_THEME } from "./color-themes/cyan"
import { INDIGO_TERM_THEME } from "./color-themes/indigo"
import { TEAL_TERM_THEME } from "./color-themes/teal"
export { DIMMED_TERM_COLOR_THEME } from "./color-themes/dimmed"

export const TERM_COLOR_PALETTES: TermColorTheme[] = [
  BLUE_TERM_THEME,
  EMERALD_TERM_THEME,
  PURPLE_TERM_THEME,
  AMBER_TERM_THEME,
  CYAN_TERM_THEME,
  INDIGO_TERM_THEME,
  TEAL_TERM_THEME,
]

export function getTermColorTheme(index: number): TermColorTheme {
  return (
    TERM_COLOR_PALETTES[index % TERM_COLOR_PALETTES.length] ||
    TERM_COLOR_PALETTES[0]!
  )
}
