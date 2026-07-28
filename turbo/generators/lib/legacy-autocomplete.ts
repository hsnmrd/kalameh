import type { PlopTypes } from "@turbo/gen"
import { createRequire } from "node:module"
import path from "node:path"

import ansiEscapes from "./ansi-escapes"
import { repoRoot } from "./paths"

const require = createRequire(path.join(repoRoot, "package.json"))

let autocomplete: unknown = null
let autocompleteFill: unknown = null

try {
  const autocompleteModule = require("inquirer-autocomplete-prompt")
  autocomplete =
    (autocompleteModule as { default?: unknown }).default ?? autocompleteModule
  const BaseAutocomplete = autocomplete as new (...args: any[]) => {
    ensureSelectedInRange: () => void
    render(error?: string): void
    search: (term?: string) => void
    currentChoices: {
      getChoice: (
        index: number
      ) => { value?: unknown; name?: unknown } | undefined
    }
    nbChoices: number
    selected: number
    lastSearchTerm: string | undefined
    opt: {
      suggestOnly?: boolean
      fillInputOnSelect?: boolean
      startWithoutSelection?: boolean
    }
    rl: {
      line: string
      cursor: number
      write: (input: string) => void
      output: { write: (input: string) => void }
    }
  }
  autocompleteFill = class AutocompleteFill extends BaseAutocomplete {
    private hasSelection = false

    render(error?: string) {
      if (this.opt.startWithoutSelection && !this.hasSelection) {
        const prevSelected = this.selected
        this.selected = -1
        super.render(error)
        this.selected = prevSelected
        return
      }
      super.render(error)
    }

    private syncLineToSelection() {
      if (!this.opt.fillInputOnSelect) return
      if (!this.currentChoices) return
      const choice = this.currentChoices.getChoice(this.selected)
      if (!choice) return
      const value = choice.value ?? choice.name ?? ""
      const line = String(value ?? "")
      this.rl.line = line
      this.rl.cursor = line.length
    }

    onKeypress(e: { key?: { name?: string; ctrl?: boolean } }) {
      let len
      const keyName = (e.key && e.key.name) || undefined

      if (keyName === "tab" && this.opt.suggestOnly) {
        const choice = this.currentChoices.getChoice(this.selected)
        if (choice) {
          this.rl.write(ansiEscapes.cursorLeft)
          const autoCompleted = String(choice.value ?? "")
          this.rl.write(ansiEscapes.cursorForward(autoCompleted.length))
          this.rl.line = autoCompleted
          this.rl.cursor = autoCompleted.length
          this.render()
        }
      } else if (keyName === "down" || (keyName === "n" && e.key?.ctrl)) {
        len = this.nbChoices
        if (len === 0) {
          this.render()
          return
        }
        if (this.opt.startWithoutSelection && !this.hasSelection) {
          this.selected = 0
          this.hasSelection = true
        } else {
          this.selected = this.selected < len - 1 ? this.selected + 1 : 0
        }
        this.ensureSelectedInRange()
        this.syncLineToSelection()
        this.render()
        this.rl.output.write(ansiEscapes.cursorUp(2))
      } else if (keyName === "up" || (keyName === "p" && e.key?.ctrl)) {
        len = this.nbChoices
        if (len === 0) {
          this.render()
          return
        }
        if (this.opt.startWithoutSelection && !this.hasSelection) {
          this.selected = 0
          this.hasSelection = true
        } else {
          this.selected = this.selected > 0 ? this.selected - 1 : len - 1
        }
        this.ensureSelectedInRange()
        this.syncLineToSelection()
        this.render()
      } else {
        this.render()
        if (this.lastSearchTerm !== this.rl.line) {
          this.search(this.rl.line)
        }
      }
    }
  }
} catch {
  autocomplete = null
  autocompleteFill = null
}

export const hasAutocompletePrompts = Boolean(
  autocomplete &&
  autocompleteFill &&
  process.env.TURBO_GEN_LEGACY_AUTOCOMPLETE === "1"
)

export const registerLegacyAutocompletePrompts = (
  plop: PlopTypes.NodePlopAPI
) => {
  if (!hasAutocompletePrompts) return
  plop.setPrompt("autocomplete", autocomplete as unknown as any)
  plop.setPrompt("autocomplete-fill", autocompleteFill as unknown as any)
}
