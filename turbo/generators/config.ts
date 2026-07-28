import type { PlopTypes } from "@turbo/gen"
import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"

import ansiEscapes from "./lib/ansi-escapes"
import {
  hasAutocompletePrompts,
  registerLegacyAutocompletePrompts,
} from "./lib/legacy-autocomplete"
import { normalizeRepoPath, repoRoot, templatePath } from "./lib/paths"
import {
  lastRunPath,
  registerTrackingActions,
  resolveDestPath,
  type TrackedOperation,
  type TrackingRun,
  withTracking,
} from "./lib/tracking"

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  registerLegacyAutocompletePrompts(plop)
  registerTrackingActions(plop)

  plop.setActionType(
    "normalize-page-parent-root",
    async (data, cfg, plopApi) => {
      if (!cfg || typeof cfg !== "object" || typeof cfg.path !== "string") {
        throw new Error("normalize-page-parent-root requires a path.")
      }
      const segmentAbsolutePath = resolveDestPath(
        data,
        cfg as Record<string, unknown>,
        plopApi
      )
      const movedCount = movePageArtifactsIntoRoot(segmentAbsolutePath)
      const relativePath = normalizeRepoPath(segmentAbsolutePath)
      if (movedCount === 0) {
        return `skip normalize ${relativePath}`
      }
      return `normalize ${relativePath} (${movedCount} item(s) moved)`
    }
  )

  const appsDir = path.join(process.cwd(), "apps")
  const allowPromptBypass = process.env.CI === "1"
  const conditionalWhen = <T>(
    predicate: (answers: T) => boolean
  ): boolean | ((answers: T) => boolean) =>
    allowPromptBypass ? true : predicate
  const appChoices = fs.existsSync(appsDir)
    ? fs
        .readdirSync(appsDir, { withFileTypes: true })
        .filter(
          (dirent) => dirent.isDirectory() && !dirent.name.startsWith(".")
        )
        .map((dirent) => dirent.name)
    : []
  const apps = appChoices.length > 0 ? appChoices : ["web", "docs"]
  const dashCaseHelper = plop.getHelper("dashCase") as
    ((value: string) => string) | undefined
  const camelCaseHelper = plop.getHelper("camelCase") as
    ((value: string) => string) | undefined
  const pascalCaseHelper = plop.getHelper("pascalCase") as
    ((value: string) => string) | undefined
  const toDashCase = (value: string) =>
    dashCaseHelper
      ? dashCaseHelper(value)
      : value
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .replace(/[\s_]+/g, "-")
          .toLowerCase()
  const toCamelCase = (value: string) => {
    if (camelCaseHelper) return camelCaseHelper(value)
    return toDashCase(value).replace(/-([a-z0-9])/g, (_, chr) =>
      String(chr).toUpperCase()
    )
  }
  const toPascalCase = (value: string) => {
    if (pascalCaseHelper) return pascalCaseHelper(value)
    const camel = toCamelCase(value)
    return camel ? camel[0].toUpperCase() + camel.slice(1) : ""
  }

  const resolveAppRoot = (appName: string) => {
    const srcPath = path.join("apps", appName, "src", "app")
    const legacyPath = path.join("apps", appName, "app")
    if (fs.existsSync(path.join(repoRoot, srcPath))) return srcPath
    return legacyPath
  }
  const resolveAppRootAbsolute = (appName: string) =>
    path.join(repoRoot, resolveAppRoot(appName))
  const resolveAppSrcRoot = (appName: string) => {
    const srcPath = path.join("apps", appName, "src")
    if (fs.existsSync(path.join(repoRoot, srcPath))) return srcPath
    return path.join("apps", appName)
  }

  const normalizeSegments = (value: string) => {
    const parts = value
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)
    return parts.map((part) => ({
      raw: part,
      path: toDashCase(part),
    }))
  }

  const getTranslationLocales = () => {
    const translationTypePath = path.join(
      repoRoot,
      "packages",
      "translation",
      "src",
      "type.ts"
    )
    if (!fs.existsSync(translationTypePath)) return []
    const content = fs.readFileSync(translationTypePath, "utf8")
    const match = content.match(/locales\s*=\s*\[([^\]]*)\]/u)
    if (!match) return []
    return match[1]
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => value.replace(/['"`]/g, ""))
      .filter(Boolean)
  }

  const rootPageFiles = ["page.tsx", "page.jsx", "page.ts", "page.js"]
  const pageScaffoldFiles = [
    ...rootPageFiles,
    "layout.tsx",
    "layout.jsx",
    "layout.ts",
    "layout.js",
    "loading.tsx",
    "loading.jsx",
    "loading.ts",
    "loading.js",
    "page.test.tsx",
    "page.test.jsx",
    "page.test.ts",
    "page.test.js",
  ]
  const pageSupportDirs = [
    "components",
    "hooks",
    "mock-data",
    "modal",
    "helper",
  ]
  const isPageSupportDir = (dirName: string) =>
    dirName === "(component)" ||
    dirName === "(common)" ||
    pageSupportDirs.includes(dirName)
  const hasPageFile = (dirPath: string) =>
    rootPageFiles.some((file) => fs.existsSync(path.join(dirPath, file)))
  const hasNestedSegments = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) return false
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return entries.some((entry) => {
      if (!entry.isDirectory()) return false
      if (entry.name.startsWith(".")) return false
      if (entry.name === "(root)") return false
      return !isPageSupportDir(entry.name)
    })
  }
  const normalizePagePathInput = (value: string) => {
    const raw = String(value ?? "").trim()
    if (raw === "" || raw === "(root)") return ""
    return normalizeSegments(raw)
      .map((segment) => segment.path)
      .join("/")
  }
  const resolveFeatureBasePath = (appName: string, featureName: string) => {
    const featureSegment = `(${toDashCase(featureName)})`
    const relativePath = `${resolveAppRoot(appName)}/${featureSegment}`
    const absolutePath = path.join(repoRoot, relativePath)
    return { featureSegment, relativePath, absolutePath }
  }
  const resolvePageContainerAbsolute = (
    appName: string,
    featureName: string,
    pageInput: string
  ) => {
    const { absolutePath: featureAbsolutePath } = resolveFeatureBasePath(
      appName,
      featureName
    )
    const pagePath = normalizePagePathInput(pageInput)
    if (!pagePath) {
      return path.join(featureAbsolutePath, "(root)")
    }
    const pageAbsolutePath = path.join(featureAbsolutePath, pagePath)
    const pageRootAbsolutePath = path.join(pageAbsolutePath, "(root)")
    if (fs.existsSync(pageRootAbsolutePath)) {
      return pageRootAbsolutePath
    }
    if (hasNestedSegments(pageAbsolutePath)) {
      return pageRootAbsolutePath
    }
    return pageAbsolutePath
  }
  const resolvePageContainerPath = (
    appName: string,
    featureName: string,
    pageInput: string
  ) =>
    normalizeRepoPath(
      resolvePageContainerAbsolute(appName, featureName, pageInput)
    )

  const movePageArtifactsIntoRoot = (segmentAbsolutePath: string) => {
    if (!fs.existsSync(segmentAbsolutePath)) return 0
    const segmentRootAbsolutePath = path.join(segmentAbsolutePath, "(root)")
    if (fs.existsSync(segmentRootAbsolutePath)) return 0

    const entriesToMove = [...pageScaffoldFiles, ...pageSupportDirs]
    const existingEntries = entriesToMove.filter((entryName) =>
      fs.existsSync(path.join(segmentAbsolutePath, entryName))
    )
    if (existingEntries.length === 0) return 0

    fs.mkdirSync(segmentRootAbsolutePath, { recursive: true })
    for (const entryName of existingEntries) {
      const sourcePath = path.join(segmentAbsolutePath, entryName)
      const destinationPath = path.join(segmentRootAbsolutePath, entryName)
      fs.renameSync(sourcePath, destinationPath)
    }
    return existingEntries.length
  }

  const validateNonEmpty = (value: unknown) => {
    if (String(value ?? "").trim().length === 0) {
      return "Name is required."
    }
    return true
  }

  const getFeatureChoices = (
    appName: unknown,
    options?: { includeCommon?: boolean }
  ) => {
    const appPath = resolveAppRootAbsolute(String(appName || ""))
    if (!fs.existsSync(appPath)) return []
    const entries = fs
      .readdirSync(appPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith("."))
      .map((dirent) => dirent.name)
    const groupEntries = entries.filter(
      (entry) => entry.startsWith("(") && entry.endsWith(")")
    )
    const rawChoices = groupEntries.length > 0 ? groupEntries : entries
    const sorted = rawChoices
      .map((entry) => entry.replace(/^\((.+)\)$/u, "$1"))
      .sort()
    if (options?.includeCommon) {
      return ["common", ...sorted.filter((choice) => choice !== "common")]
    }
    return sorted
  }

  const listPagePaths = (appName: unknown, featureName: unknown) => {
    if (!appName || !featureName) return []
    const { absolutePath: featureDir } = resolveFeatureBasePath(
      String(appName),
      String(featureName)
    )
    if (!fs.existsSync(featureDir)) return []

    const results = new Set<string>()
    const walk = (currentDir: string, relPath: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        if (entry.name.startsWith(".")) continue
        if (isPageSupportDir(entry.name)) continue
        if (entry.name === "(root)") {
          results.add(relPath)
          continue
        }
        const nextRel = relPath
          ? path.posix.join(relPath, entry.name)
          : entry.name
        const entryPath = path.join(currentDir, entry.name)
        if (hasPageFile(entryPath)) {
          results.add(nextRel)
        }
        walk(entryPath, nextRel)
      }
    }

    walk(featureDir, "")
    return Array.from(results).sort()
  }

  const hasRootPage = (appName: unknown, featureName: unknown) => {
    if (!appName || !featureName) return false
    const rootDir = resolvePageContainerAbsolute(
      String(appName),
      String(featureName),
      ""
    )
    return hasPageFile(rootDir)
  }

  const listSegmentPaths = (appName: unknown, featureName: unknown) => {
    if (!appName || !featureName) return []
    const featureDir = path.join(
      resolveAppRootAbsolute(String(appName)),
      `(${toDashCase(String(featureName))})`
    )
    if (!fs.existsSync(featureDir)) return []

    const results = new Set<string>()
    const walk = (currentDir: string, relPath: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        if (entry.name.startsWith(".")) continue
        if (entry.name === "(root)" || isPageSupportDir(entry.name)) continue
        const nextRel = relPath
          ? path.posix.join(relPath, entry.name)
          : entry.name
        results.add(nextRel)
        walk(path.join(currentDir, entry.name), nextRel)
      }
    }

    walk(featureDir, "")
    return Array.from(results).sort()
  }

  const componentIndexFiles = new Set([
    "index.tsx",
    "index.jsx",
    "index.ts",
    "index.js",
  ])
  const listComponentNames = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) return []
    const results = new Set<string>()
    const walk = (currentDir: string, relPath: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      let hasIndex = false
      for (const entry of entries) {
        if (entry.isFile() && componentIndexFiles.has(entry.name)) {
          hasIndex = true
        }
      }
      if (hasIndex && relPath) {
        results.add(relPath)
      }
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        if (entry.name.startsWith(".")) continue
        const nextRel = relPath
          ? path.posix.join(relPath, entry.name)
          : entry.name
        walk(path.join(currentDir, entry.name), nextRel)
      }
    }
    walk(dirPath, "")
    return Array.from(results).sort()
  }

  const listComponentChoices = (answers: Record<string, unknown>) => {
    const scope = String(answers.scope || "ui")
    const app = String(answers.app || "")
    const feature = String(answers.feature || "")
    const pageInput = String(answers.page || "")

    if (scope === "ui") {
      return listComponentNames(
        path.join(repoRoot, "packages", "ui", "src", "components")
      )
    }

    if (scope === "app") {
      if (!app) return []
      return listComponentNames(
        path.join(repoRoot, "apps", app, "src", "components")
      )
    }

    if (scope === "feature") {
      if (!app || !feature) return []
      const featureSegment = `(${toDashCase(feature)})`
      return listComponentNames(
        path.join(
          resolveAppRootAbsolute(app),
          featureSegment,
          "(common)",
          "components"
        )
      )
    }

    if (scope === "page") {
      if (!app || !feature) return []
      return listComponentNames(
        path.join(
          resolvePageContainerAbsolute(app, feature, pageInput),
          "components"
        )
      )
    }

    return []
  }

  const filterChoices = (
    choices: Array<string | { name: string; value: string }>,
    input: string | undefined
  ) => {
    const normalized = (input ?? "").toString().toLowerCase()
    const normalizedChoices = choices.map((choice) =>
      typeof choice === "string" ? { name: choice, value: choice } : choice
    )
    let filtered = normalizedChoices
    if (normalized) {
      filtered = normalizedChoices.filter(
        (choice) =>
          choice.name.toLowerCase().includes(normalized) ||
          choice.value.toLowerCase().includes(normalized)
      )
      const hasExact = normalizedChoices.some(
        (choice) => choice.value.toLowerCase() === normalized
      )
      if (!hasExact) {
        filtered = [{ name: `Use "${input}"`, value: input ?? "" }, ...filtered]
      }
    }
    return filtered
  }

  type AutocompleteChoice = { name: string; value: string }
  type AutocompleteSource = (
    answers: Record<string, unknown>,
    input: string | undefined
  ) =>
    | Array<string | { name: string; value: string }>
    | Promise<Array<string | { name: string; value: string }>>
  type AutocompleteValidate = (
    value: unknown,
    answers: Record<string, unknown>
  ) => true | string | Promise<true | string>
  type PromptWhen =
    | boolean
    | ((answers: Record<string, unknown>) => boolean | Promise<boolean>)
    | undefined
  type AutocompletePromptConfig = Record<string, unknown> & {
    source?: AutocompleteSource
    validate?: AutocompleteValidate
    when?: PromptWhen
    fillInputOnSelect?: boolean
    startWithoutSelection?: boolean
    suggestOnly?: boolean
    name?: string
    message?: string
    type?: string
  }

  const normalizeAutocompleteChoices = (
    choices: Array<string | { name: string; value: string }>
  ): AutocompleteChoice[] =>
    choices.map((choice) =>
      typeof choice === "string"
        ? { name: choice, value: choice }
        : {
            name: String(choice.name ?? choice.value ?? ""),
            value: String(choice.value ?? ""),
          }
    )

  const resolvePromptWhen = async (
    when: PromptWhen,
    answers: Record<string, unknown>
  ) => {
    if (typeof when === "function") {
      return Boolean(await when(answers))
    }
    if (typeof when === "boolean") {
      return when
    }
    return true
  }

  const isPrintableKey = (
    value: string,
    key: { name?: string; ctrl?: boolean; meta?: boolean }
  ) => {
    if (!value) return false
    if (key.ctrl || key.meta) return false
    const keyName = String(key.name || "")
    return (
      keyName !== "return" &&
      keyName !== "enter" &&
      keyName !== "up" &&
      keyName !== "down" &&
      keyName !== "left" &&
      keyName !== "right" &&
      keyName !== "tab" &&
      keyName !== "backspace" &&
      keyName !== "delete" &&
      keyName !== "escape"
    )
  }

  const runReadlineAutocompletePrompt = async ({
    message,
    answers,
    source,
    validate,
    suggestOnly,
    fillInputOnSelect,
    startWithoutSelection,
  }: {
    message: string
    answers: Record<string, unknown>
    source: AutocompleteSource
    validate?: AutocompleteValidate
    suggestOnly: boolean
    fillInputOnSelect: boolean
    startWithoutSelection: boolean
  }) =>
    new Promise<string>((resolve, reject) => {
      const stdin = process.stdin as NodeJS.ReadStream & {
        setRawMode?: (isRaw: boolean) => void
        isRaw?: boolean
      }
      const stdout = process.stdout
      const wasRaw = Boolean(stdin.isRaw)
      const pageSize = 7
      const cyan = (value: string) => `\u001b[36m${value}\u001b[39m`
      let input = ""
      let searchTerm: string | undefined = undefined
      let selected = startWithoutSelection ? -1 : 0
      let hasSelection = !startWithoutSelection
      let loading = false
      let errorMessage = ""
      let choices: AutocompleteChoice[] = []
      let renderedLines = 0
      let closed = false
      let requestCounter = 0
      let keypressQueue = Promise.resolve()

      const clearRender = () => {
        if (renderedLines === 0) return
        const linesToMoveUp = renderedLines > 1 ? renderedLines - 1 : 0
        if (linesToMoveUp > 0) {
          stdout.write(ansiEscapes.cursorUp(linesToMoveUp))
        }
        stdout.write("\r")
        stdout.write(ansiEscapes.eraseDown)
        renderedLines = 0
      }

      const finalize = (value: string) => {
        clearRender()
        stdout.write(`? ${message} ${value}\n`)
        closed = true
        stdin.removeListener("keypress", onKeypress)
        if (!wasRaw && typeof stdin.setRawMode === "function") {
          stdin.setRawMode(false)
        }
        resolve(value)
      }

      const abort = (error: Error) => {
        clearRender()
        closed = true
        stdin.removeListener("keypress", onKeypress)
        if (!wasRaw && typeof stdin.setRawMode === "function") {
          stdin.setRawMode(false)
        }
        reject(error)
      }

      const render = () => {
        if (closed) return
        clearRender()
        const lines: string[] = []
        lines.push(`? ${message} ${input}`)
        lines.push(
          `  ${
            suggestOnly
              ? "Use arrow keys or type to search, tab to autocomplete"
              : "Use arrow keys or type to search"
          }`
        )
        if (loading) {
          lines.push("  Searching...")
        } else if (choices.length === 0) {
          lines.push("  No results")
        } else {
          let start = 0
          if (selected >= pageSize) {
            start = selected - pageSize + 1
          }
          const visibleChoices = choices.slice(start, start + pageSize)
          for (let index = 0; index < visibleChoices.length; index += 1) {
            const absoluteIndex = start + index
            const marker = absoluteIndex === selected ? "❯" : " "
            const line = `${marker} ${visibleChoices[index].name}`
            lines.push(absoluteIndex === selected ? cyan(line) : line)
          }
          if (choices.length > start + pageSize) {
            lines.push("  (Move up and down to reveal more choices)")
          }
        }
        if (errorMessage) {
          lines.push(`  ${errorMessage}`)
        }
        stdout.write(lines.join("\n"))
        renderedLines = lines.length
      }

      const loadChoices = async () => {
        const requestId = ++requestCounter
        loading = true
        errorMessage = ""
        render()
        try {
          const nextChoices = await Promise.resolve(source(answers, searchTerm))
          if (closed || requestId !== requestCounter) return
          choices = normalizeAutocompleteChoices(nextChoices)
          if (choices.length === 0) {
            selected = -1
            hasSelection = false
          } else if (hasSelection) {
            if (selected < 0 || selected >= choices.length) {
              selected = 0
            }
          } else {
            selected = -1
          }
        } catch (error) {
          if (closed || requestId !== requestCounter) return
          choices = []
          selected = -1
          hasSelection = false
          errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to load autocomplete choices."
        } finally {
          if (closed || requestId !== requestCounter) return
          loading = false
          render()
        }
      }

      const handleKeypress = async (
        value: string,
        key: { name?: string; ctrl?: boolean; meta?: boolean }
      ) => {
        if (closed) return
        const keyName = String(key.name || "")
        if (key.ctrl && keyName === "c") {
          abort(new Error("Prompt cancelled by user."))
          return
        }
        if (keyName === "return" || keyName === "enter") {
          const selectedChoice =
            selected >= 0 && selected < choices.length
              ? choices[selected]
              : null
          let submitted = suggestOnly
            ? input
            : selectedChoice
              ? selectedChoice.value
              : input
          submitted = String(submitted ?? "").trim()
          if (validate) {
            const validationResult = await validate(submitted, answers)
            if (validationResult !== true) {
              errorMessage =
                typeof validationResult === "string"
                  ? validationResult
                  : "Invalid value."
              render()
              return
            }
          }
          finalize(submitted)
          return
        }
        if (keyName === "tab") {
          if (choices.length === 0) return
          if (!hasSelection || selected < 0 || selected >= choices.length) {
            selected = 0
          }
          hasSelection = true
          input = choices[selected].value
          render()
          return
        }
        if (keyName === "up" || keyName === "down") {
          if (choices.length === 0) return
          if (!hasSelection || selected < 0 || selected >= choices.length) {
            selected = keyName === "up" ? choices.length - 1 : 0
            hasSelection = true
          } else if (keyName === "up") {
            selected = selected > 0 ? selected - 1 : choices.length - 1
          } else {
            selected = selected < choices.length - 1 ? selected + 1 : 0
          }
          if (fillInputOnSelect && selected >= 0 && selected < choices.length) {
            input = choices[selected].value
            render()
            return
          }
          render()
          return
        }
        if (keyName === "backspace" || keyName === "delete") {
          if (input.length === 0) return
          input = input.slice(0, -1)
          searchTerm = input || undefined
          if (startWithoutSelection) {
            hasSelection = false
            selected = -1
          }
          await loadChoices()
          return
        }
        if (isPrintableKey(value, key)) {
          input += value
          searchTerm = input || undefined
          if (startWithoutSelection) {
            hasSelection = false
            selected = -1
          }
          await loadChoices()
        }
      }

      const onKeypress = (
        value: string,
        key: { name?: string; ctrl?: boolean; meta?: boolean } = {}
      ) => {
        keypressQueue = keypressQueue.then(() => handleKeypress(value, key))
        void keypressQueue.catch((error) => {
          abort(error instanceof Error ? error : new Error(String(error)))
        })
      }

      readline.emitKeypressEvents(stdin)
      if (typeof stdin.setRawMode === "function") {
        stdin.setRawMode(true)
      }
      stdin.on("keypress", onKeypress)
      void loadChoices().catch((error) => {
        abort(error instanceof Error ? error : new Error(String(error)))
      })
    })

  const autocompletePrompt = (prompt: AutocompletePromptConfig) => {
    const promptType = String(prompt.type ?? "")
    if (hasAutocompletePrompts) {
      return prompt as unknown as PlopTypes.PromptQuestion
    }
    if (promptType !== "autocomplete" && promptType !== "autocomplete-fill") {
      return prompt as unknown as PlopTypes.PromptQuestion
    }
    if (allowPromptBypass) {
      return {
        ...prompt,
        type: "input",
      } as unknown as PlopTypes.PromptQuestion
    }
    const {
      source,
      validate,
      when,
      fillInputOnSelect,
      startWithoutSelection,
      suggestOnly,
      ...rest
    } = prompt
    if (typeof source !== "function") {
      return {
        ...prompt,
        type: "input",
      } as unknown as PlopTypes.PromptQuestion
    }
    const sourceFn = source as AutocompleteSource
    const validateFn =
      typeof validate === "function"
        ? (validate as AutocompleteValidate)
        : undefined
    const promptName = String(prompt.name ?? "")
    const promptMessage = String(prompt.message ?? promptName)
    return {
      ...rest,
      type: "input",
      name: promptName,
      when: async (answers: Record<string, unknown>) => {
        const shouldAsk = await resolvePromptWhen(when as PromptWhen, answers)
        if (!shouldAsk) return false
        const answerValue = await runReadlineAutocompletePrompt({
          message: promptMessage,
          answers,
          source: sourceFn,
          validate: validateFn,
          suggestOnly: Boolean(
            suggestOnly || promptType === "autocomplete-fill"
          ),
          fillInputOnSelect: Boolean(
            fillInputOnSelect || promptType === "autocomplete-fill"
          ),
          startWithoutSelection: Boolean(startWithoutSelection),
        })
        answers[promptName] = answerValue
        return false
      },
    } as unknown as PlopTypes.PromptQuestion
  }

  plop.setGenerator("page", {
    description: "Add a page inside an existing Next.js feature group",
    prompts: [
      {
        type: "list",
        name: "app",
        message: "Target app",
        choices: apps,
      },
      autocompletePrompt({
        type: "autocomplete",
        name: "feature",
        message: "Feature name (e.g. authentication)",
        validate: (value: unknown) => {
          if (String(value ?? "").trim().length === 0) {
            return "Feature name is required."
          }
          return true
        },
        source: (answers, input) =>
          Promise.resolve(filterChoices(getFeatureChoices(answers.app), input)),
      }),
      autocompletePrompt({
        type: "autocomplete-fill",
        name: "page",
        message: "Page name (e.g. information, otp, new-password)",
        fillInputOnSelect: true,
        startWithoutSelection: true,
        suggestOnly: true,
        validate: (value: unknown, answers: Record<string, unknown>) => {
          const text = String(value ?? "").trim()
          if (text.length === 0) {
            return "Page name is required."
          }
          if (text === "(root)" && hasRootPage(answers.app, answers.feature)) {
            return "Root page already exists."
          }
          return true
        },
        source: (answers, input) => {
          const pages = listPagePaths(answers.app, answers.feature)
            .filter((page) => page !== "")
            .map((page) => ({
              name: page,
              value: page,
            }))
          if (!hasRootPage(answers.app, answers.feature)) {
            pages.unshift({ name: "(root)", value: "(root)" })
          }
          return Promise.resolve(filterChoices(pages, input))
        },
      }),
    ],
    actions: (data) => {
      if (!data) return []
      const app = String(data.app || "")
      const feature = String(data.feature || "")
      const appRoot = resolveAppRoot(app)
      const featureSegment = `(${toDashCase(feature)})`
      const actions: PlopTypes.ActionType[] = []
      const rawPageInput = String(data.page || "").trim()
      const isRootSelection = rawPageInput === "(root)" || rawPageInput === ""
      const rawPage = isRootSelection ? "" : rawPageInput
      const segments = normalizeSegments(rawPage)
      const path = segments.map((segment) => segment.path).join("/")
      const name = isRootSelection
        ? "root"
        : segments.map((segment) => segment.raw).join(" ")
      const addedSegments = new Set<string>()

      const addSegmentScaffold = (segmentPath: string, segmentName: string) => {
        if (addedSegments.has(segmentPath)) return
        addedSegments.add(segmentPath)
        actions.push({
          type: "normalize-page-parent-root",
          path: `${appRoot}/${featureSegment}/${segmentPath}`,
        } as PlopTypes.ActionType)
        const segmentBasePath = `${appRoot}/${featureSegment}/${segmentPath}/(root)`
        actions.push(
          {
            type: "add",
            path: `${segmentBasePath}/layout.tsx`,
            templateFile: "templates/nextjs/layout.tsx.hbs",
            data: { page: segmentName },
            skipIfExists: true,
          },
          {
            type: "add",
            path: `${segmentBasePath}/loading.tsx`,
            templateFile: "templates/nextjs/loading.tsx.hbs",
            data: { page: segmentName },
            skipIfExists: true,
          }
        )
      }

      if (segments.length > 1) {
        let currentPath = ""
        const parents = segments.slice(0, -1)
        for (const segment of parents) {
          currentPath = currentPath
            ? `${currentPath}/${segment.path}`
            : segment.path
          addSegmentScaffold(currentPath, segment.raw)
        }
      }

      const pageBasePath = resolvePageContainerPath(
        app,
        feature,
        isRootSelection ? "" : path
      )

      actions.push(
        {
          type: "add",
          path: `${pageBasePath}/page.tsx`,
          templateFile: templatePath("nextjs", "page.tsx.hbs"),
          data: { page: name },
          skipIfExists: true,
        },
        {
          type: "add",
          path: `${pageBasePath}/layout.tsx`,
          templateFile: templatePath("nextjs", "layout.tsx.hbs"),
          data: { page: name },
          skipIfExists: true,
        },
        {
          type: "add",
          path: `${pageBasePath}/loading.tsx`,
          templateFile: templatePath("nextjs", "loading.tsx.hbs"),
          data: { page: name },
          skipIfExists: true,
        },
        {
          type: "add",
          path: `${pageBasePath}/page.test.tsx`,
          templateFile: templatePath("nextjs", "page.test.tsx.hbs"),
          data: { page: name },
          skipIfExists: true,
        }
      )

      return withTracking("page", actions)
    },
  })

  plop.setGenerator("component", {
    description: "Create a React component in ui, app, feature, or page scope",
    prompts: [
      {
        type: "list",
        name: "scope",
        message: "Component scope",
        choices: [
          {
            name: "Feature shared (apps/{app}/src/app/(feature)/(common)/components)",
            value: "feature",
          },
          {
            name: "Page shared (apps/{app}/src/app/(feature)/{page}/components)",
            value: "page",
          },
          { name: "App shared (apps/{app}/src/components)", value: "app" },
          { name: "UI shared (packages/ui/components)", value: "ui" },
        ],
      },
      {
        type: "list",
        name: "app",
        message: "Target app",
        choices: apps,
        when: conditionalWhen((answers) => answers.scope !== "ui"),
      },
      autocompletePrompt({
        type: "autocomplete",
        name: "feature",
        message: "Feature name",
        when: conditionalWhen(
          (answers) => answers.scope === "feature" || answers.scope === "page"
        ),
        source: (answers, input) =>
          Promise.resolve(filterChoices(getFeatureChoices(answers.app), input)),
      }),
      autocompletePrompt({
        type: "autocomplete",
        name: "page",
        message: "Page path (use / for nested)",
        when: conditionalWhen((answers) => answers.scope === "page"),
        source: (answers, input) => {
          const pages = listPagePaths(answers.app, answers.feature).map(
            (page) => ({
              name: page === "" ? "(root)" : page,
              value: page,
            })
          )
          return Promise.resolve(filterChoices(pages, input))
        },
      }),
      autocompletePrompt({
        type: "autocomplete-fill",
        name: "name",
        message: "Component name",
        fillInputOnSelect: true,
        startWithoutSelection: true,
        suggestOnly: true,
        validate: validateNonEmpty,
        source: (answers, input) =>
          Promise.resolve(filterChoices(listComponentChoices(answers), input)),
      }),
      {
        type: "confirm",
        name: "useClient",
        message: 'Add a "use client" directive?',
        default: true,
      },
    ],
    actions: (data) => {
      if (!data) return []
      const scope = String(data.scope || "ui")
      const app = String(data.app || "")
      const feature = String(data.feature || "")
      const pageInput = String(data.page || "")
      const baseName = String(data.name || "").trim()
      const nameSegments = baseName
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean)
      const fileComponentName =
        nameSegments.length > 0
          ? nameSegments[nameSegments.length - 1]
          : baseName
      const componentDir = nameSegments
        .slice(0, -1)
        .map((segment) => toDashCase(segment))
        .join("/")
      const componentDirPrefix = componentDir ? `${componentDir}/` : ""
      const featureName = String(data.feature || "").trim()
      const componentName =
        scope === "ui" || scope === "app"
          ? fileComponentName
          : [
              featureName,
              scope === "feature" ? "common" : "",
              fileComponentName,
            ]
              .filter(Boolean)
              .join(" ")
      data.componentName = componentName
      data.fileComponentName = fileComponentName
      data.componentDirPrefix = componentDirPrefix
      const actions: PlopTypes.ActionType[] = []

      if (scope === "ui") {
        actions.push({
          type: "add",
          path: "packages/ui/src/components/{{componentDirPrefix}}{{dashCase fileComponentName}}/index.tsx",
          templateFile: templatePath("react-component.hbs"),
        })
        actions.push({
          type: "add",
          path: "packages/ui/src/components/{{componentDirPrefix}}{{dashCase fileComponentName}}/index.test.tsx",
          templateFile: templatePath("react-component.test.tsx.hbs"),
        })
        return withTracking("component", actions)
      }

      if (scope === "app") {
        actions.push({
          type: "add",
          path: `apps/${app}/src/components/{{componentDirPrefix}}{{dashCase fileComponentName}}/index.tsx`,
          templateFile: templatePath("react-component.hbs"),
        })
        actions.push({
          type: "add",
          path: `apps/${app}/src/components/{{componentDirPrefix}}{{dashCase fileComponentName}}/index.test.tsx`,
          templateFile: templatePath("react-component.test.tsx.hbs"),
        })
        return withTracking("component", actions)
      }

      const appRoot = resolveAppRoot(app)
      const featureSegment = `(${toDashCase(feature)})`

      if (scope === "feature") {
        actions.push({
          type: "add",
          path: `${appRoot}/${featureSegment}/(common)/components/{{componentDirPrefix}}{{dashCase fileComponentName}}/index.tsx`,
          templateFile: templatePath("react-component.hbs"),
        })
        actions.push({
          type: "add",
          path: `${appRoot}/${featureSegment}/(common)/components/{{componentDirPrefix}}{{dashCase fileComponentName}}/index.test.tsx`,
          templateFile: templatePath("react-component.test.tsx.hbs"),
        })
        return withTracking("component", actions)
      }

      const pageBasePath = resolvePageContainerPath(app, feature, pageInput)

      actions.push({
        type: "add",
        path: `${pageBasePath}/components/{{componentDirPrefix}}{{dashCase fileComponentName}}/index.tsx`,
        templateFile: templatePath("react-component.hbs"),
      })
      actions.push({
        type: "add",
        path: `${pageBasePath}/components/{{componentDirPrefix}}{{dashCase fileComponentName}}/index.test.tsx`,
        templateFile: templatePath("react-component.test.tsx.hbs"),
      })
      return withTracking("component", actions)
    },
  })

  plop.setGenerator("feature", {
    description: "Create a Next.js feature group scaffold",
    prompts: [
      {
        type: "list",
        name: "app",
        message: "Target app",
        choices: apps,
      },
      {
        type: "input",
        name: "feature",
        message: "Feature name (e.g. authentication, landing)",
        validate: (value: unknown) => {
          if (String(value ?? "").trim().length === 0) {
            return "Feature name is required."
          }
          return true
        },
      },
    ],
    actions: (data) => {
      if (!data) return []
      const app = String(data.app || "")
      const feature = String(data.feature || "")
      const actions: PlopTypes.ActionType[] = []
      const translationDir = path.join(
        "apps",
        app,
        "src",
        "translation",
        toDashCase(feature)
      )
      for (const locale of getTranslationLocales()) {
        actions.push({
          type: "add",
          path: `${translationDir}/${locale}.json`,
          template: "{}\n",
          skipIfExists: true,
        })
      }

      return withTracking("feature", actions)
    },
  })

  plop.setGenerator("modal", {
    description: "Create a modal for a specific page inside a feature",
    prompts: [
      {
        type: "list",
        name: "app",
        message: "Target app",
        choices: apps,
      },
      autocompletePrompt({
        type: "autocomplete",
        name: "feature",
        message: "Feature name",
        validate: validateNonEmpty,
        source: (answers, input) =>
          Promise.resolve(
            filterChoices(
              getFeatureChoices(answers.app, { includeCommon: true }),
              input
            )
          ),
      }),
      autocompletePrompt({
        type: "autocomplete",
        name: "page",
        message: "Page path (use / for nested)",
        when: conditionalWhen(
          (answers) => toDashCase(String(answers.feature || "")) !== "common"
        ),
        source: (answers, input) => {
          const pages = listPagePaths(answers.app, answers.feature).map(
            (page) => ({
              name: page === "" ? "(root)" : page,
              value: page,
            })
          )
          return Promise.resolve(filterChoices(pages, input))
        },
      }),
      {
        type: "input",
        name: "name",
        message: "Modal name",
        validate: validateNonEmpty,
      },
    ],
    actions: (data) => {
      if (!data) return []
      const app = String(data.app || "")
      const feature = String(data.feature || "")
      const pageInput = String(data.page || "")
      const name = String(data.name || "")

      const appRoot = resolveAppRoot(app)
      const appSrcRoot = resolveAppSrcRoot(app)
      const normalizedFeature = toDashCase(feature)
      const isCommonFeature = normalizedFeature === "common"
      const pagePath = normalizePagePathInput(pageInput)
      const pageBasePath = isCommonFeature
        ? ""
        : resolvePageContainerPath(app, feature, pagePath)
      const modalFolderPath = isCommonFeature
        ? `${appSrcRoot}/modal`
        : `${pageBasePath}/modal`
      const registryPath = `${appSrcRoot}/modal/index.tsx`
      const wrapperPath = `${appSrcRoot}/modal/index.wrapper.tsx`

      const modalName = isCommonFeature ? name : `${feature} ${name}`.trim()
      const modalKey = toCamelCase(modalName)
      const modalPascal = toPascalCase(modalName)
      const modalFile = toCamelCase(name)
      const pageImportPath = isCommonFeature
        ? ""
        : normalizeRepoPath(
            resolvePageContainerAbsolute(app, feature, pagePath)
          ).replace(`${appSrcRoot}/`, "")
      const importBase = isCommonFeature ? "./" : `../${pageImportPath}/modal/`
      const layoutPath = `${appRoot}/layout.tsx`
      const modalWrapperName = "ModalWrapper"
      const modalWrapperImport = `import { ${modalWrapperName} } from "../modal/index.wrapper";`

      const actions: PlopTypes.ActionType[] = [
        {
          type: "add",
          path: registryPath,
          templateFile: templatePath("modal", "index.tsx.hbs"),
          skipIfExists: true,
          data: {},
        },
        {
          type: "add",
          path: wrapperPath,
          templateFile: templatePath("modal", "index.wrapper.tsx.hbs"),
          skipIfExists: true,
          data: {},
        },
        {
          type: "add",
          path: `${modalFolderPath}/${modalFile}.tsx`,
          templateFile: templatePath("modal", "dialog.tsx.hbs"),
          data: { modalName },
        },
        {
          type: "append",
          path: registryPath,
          pattern: /\/\/ PLOP: AUTO IMPORT MODALS/,
          template: `import { ${modalPascal}Dialog, ${modalPascal}DialogProperties } from "${importBase}${modalFile}";`,
        },
        {
          type: "append",
          path: registryPath,
          pattern: /\/\/ PLOP: AUTO ADD REGISTER TYPES OF MODAL/,
          template: `${modalKey}: ${modalPascal}DialogProperties;`,
        },
        {
          type: "append",
          path: registryPath,
          pattern: /\/\/ PLOP: AUTO ADD REGISTERS OF MODAL/,
          templateFile: templatePath("modal", "register.hbs"),
          data: { modalName },
        },
      ]

      actions.push({
        type: "modify",
        path: layoutPath,
        transform: (fileContents: string) => {
          let contents = fileContents
          if (!contents.includes(modalWrapperImport)) {
            const importBlock = contents.match(/^(import .*;\s*)+/m)
            if (importBlock) {
              contents = contents.replace(
                importBlock[0],
                `${importBlock[0]}${modalWrapperImport}\n`
              )
            } else {
              contents = `${modalWrapperImport}\n${contents}`
            }
          }

          if (!contents.includes(`<${modalWrapperName}>`)) {
            const childrenPattern = /\{children\}/
            if (childrenPattern.test(contents)) {
              contents = contents.replace(
                childrenPattern,
                `<${modalWrapperName}>{children}</${modalWrapperName}>`
              )
            }
          }

          return contents
        },
      })

      return withTracking("modal", actions)
    },
  })

  plop.setGenerator("artifact", {
    description:
      "Create a hook/helper/mock-data file in feature shared or page scope",
    prompts: [
      {
        type: "list",
        name: "kind",
        message: "Artifact type",
        choices: [
          { name: "Hook (hooks)", value: "hooks" },
          { name: "Helper (helper)", value: "helper" },
          { name: "Mock Data (mock-data)", value: "mock-data" },
        ],
      },
      {
        type: "list",
        name: "scope",
        message: "Artifact scope",
        choices: [
          {
            name: "Feature shared (apps/{app}/src/app/(feature)/(common)/{kind})",
            value: "feature",
          },
          {
            name: "Page scoped (apps/{app}/src/app/(feature)/{page}/{kind})",
            value: "page",
          },
        ],
      },
      {
        type: "list",
        name: "app",
        message: "Target app",
        choices: apps,
      },
      autocompletePrompt({
        type: "autocomplete",
        name: "feature",
        message: "Feature name",
        validate: validateNonEmpty,
        source: (answers, input) =>
          Promise.resolve(filterChoices(getFeatureChoices(answers.app), input)),
      }),
      autocompletePrompt({
        type: "autocomplete",
        name: "page",
        message: "Page path (use / for nested)",
        when: conditionalWhen((answers) => answers.scope === "page"),
        source: (answers, input) => {
          const pages = listPagePaths(answers.app, answers.feature).map(
            (page) => ({
              name: page === "" ? "(root)" : page,
              value: page,
            })
          )
          return Promise.resolve(filterChoices(pages, input))
        },
      }),
      {
        type: "input",
        name: "name",
        message: "Artifact name (supports nested paths with /)",
        validate: validateNonEmpty,
      },
    ],
    actions: (data) => {
      if (!data) return []
      const kind = String(data.kind || "hooks")
      const scope = String(data.scope || "feature")
      const app = String(data.app || "")
      const feature = String(data.feature || "")
      const pageInput = String(data.page || "")
      const rawName = String(data.name || "").trim()
      if (!rawName) {
        throw new Error("Artifact name is required.")
      }

      const normalizedKind =
        kind === "helper" || kind === "mock-data" ? kind : "hooks"
      const nameSegments = rawName
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean)
      const artifactFileName =
        nameSegments.length > 0
          ? nameSegments[nameSegments.length - 1]
          : rawName
      const artifactDir = nameSegments
        .slice(0, -1)
        .map((segment) => toDashCase(segment))
        .join("/")
      const artifactDirPrefix = artifactDir ? `${artifactDir}/` : ""
      const exportNameBase = toCamelCase(artifactFileName)
      const artifactExportName =
        normalizedKind === "hooks"
          ? exportNameBase.startsWith("use")
            ? exportNameBase
            : `use${toPascalCase(artifactFileName)}`
          : exportNameBase

      data.artifactFileName = artifactFileName
      data.artifactDirPrefix = artifactDirPrefix
      data.artifactExportName = artifactExportName

      const appRoot = resolveAppRoot(app)
      const featureSegment = `(${toDashCase(feature)})`
      const pageBasePath = resolvePageContainerPath(app, feature, pageInput)
      const basePath =
        scope === "feature"
          ? `${appRoot}/${featureSegment}/(common)/${normalizedKind}`
          : `${pageBasePath}/${normalizedKind}`
      const templateFileByKind: Record<string, string> = {
        hooks: templatePath("artifact", "hook.ts.hbs"),
        helper: templatePath("artifact", "helper.ts.hbs"),
        "mock-data": templatePath("artifact", "mock-data.ts.hbs"),
      }

      return withTracking("artifact", [
        {
          type: "add",
          path: `${basePath}/{{artifactDirPrefix}}{{dashCase artifactFileName}}.ts`,
          templateFile:
            templateFileByKind[normalizedKind] ?? templateFileByKind.hooks,
        },
      ])
    },
  })

  plop.setGenerator("directory", {
    description: "Add a directory-only segment inside an existing feature",
    prompts: [
      {
        type: "list",
        name: "app",
        message: "Target app",
        choices: apps,
      },
      autocompletePrompt({
        type: "autocomplete",
        name: "feature",
        message: "Feature name (e.g. authentication)",
        validate: (value: unknown) => {
          if (String(value ?? "").trim().length === 0) {
            return "Feature name is required."
          }
          return true
        },
        source: (answers, input) =>
          Promise.resolve(filterChoices(getFeatureChoices(answers.app), input)),
      }),
      autocompletePrompt({
        type: "autocomplete",
        name: "dir",
        message: "Directory name (e.g. register)",
        validate: (value: unknown) => {
          if (String(value ?? "").trim().length === 0) {
            return "Directory name is required."
          }
          return true
        },
        source: (answers, input) =>
          Promise.resolve(
            filterChoices(listSegmentPaths(answers.app, answers.feature), input)
          ),
      }),
    ],
    actions: (data) => {
      if (!data) return []
      const app = String(data.app || "")
      const feature = String(data.feature || "")
      const appRoot = resolveAppRoot(app)
      const featureSegment = `(${toDashCase(feature)})`
      const segments = normalizeSegments(String(data.dir || ""))
      const path = segments.map((segment) => segment.path).join("/")
      const name = segments.map((segment) => segment.raw).join(" ")
      const actions: PlopTypes.ActionType[] = []
      const addedSegments = new Set<string>()

      const addSegmentScaffold = (segmentPath: string, segmentName: string) => {
        if (addedSegments.has(segmentPath)) return
        addedSegments.add(segmentPath)
        const segmentBasePath = `${appRoot}/${featureSegment}/${segmentPath}/(root)`
        actions.push(
          {
            type: "add",
            path: `${segmentBasePath}/layout.tsx`,
            templateFile: "templates/nextjs/layout.tsx.hbs",
            data: { page: segmentName },
            skipIfExists: true,
          },
          {
            type: "add",
            path: `${segmentBasePath}/loading.tsx`,
            templateFile: "templates/nextjs/loading.tsx.hbs",
            data: { page: segmentName },
            skipIfExists: true,
          }
        )
      }

      if (segments.length > 1) {
        let currentPath = ""
        const parents = segments.slice(0, -1)
        for (const segment of parents) {
          currentPath = currentPath
            ? `${currentPath}/${segment.path}`
            : segment.path
          addSegmentScaffold(currentPath, segment.raw)
        }
      }

      addSegmentScaffold(path, name)
      return withTracking("directory", actions)
    },
  })

  plop.setGenerator("reverse", {
    description: "Revert the last successful turbo gen run",
    prompts: [],
    actions: () => [
      async () => {
        if (!fs.existsSync(lastRunPath)) {
          throw new Error(`No last run manifest found at ${lastRunPath}`)
        }

        const raw = fs.readFileSync(lastRunPath, "utf8")
        const lastRun = JSON.parse(raw) as TrackingRun & {
          revertedAt?: string
          operations?: TrackedOperation[]
        }

        if (lastRun.revertedAt) {
          throw new Error(`Last run already reversed at ${lastRun.revertedAt}`)
        }

        const operations = Array.isArray(lastRun.operations)
          ? lastRun.operations
          : []

        for (const op of [...operations].reverse()) {
          const relativePath = op.path
          const absPath = path.isAbsolute(relativePath)
            ? relativePath
            : path.join(repoRoot, relativePath)

          if (op.type === "add") {
            fs.rmSync(absPath, { force: true })
            continue
          }

          if (op.type === "modify") {
            if (op.beforeExisted) {
              fs.mkdirSync(path.dirname(absPath), { recursive: true })
              fs.writeFileSync(absPath, op.before, "utf8")
            } else {
              fs.rmSync(absPath, { force: true })
            }
          }
        }

        fs.writeFileSync(
          lastRunPath,
          JSON.stringify(
            { ...lastRun, revertedAt: new Date().toISOString() },
            null,
            2
          )
        )

        const warning =
          Array.isArray(lastRun.untracked) && lastRun.untracked.length > 0
            ? " (untracked actions present; review manually)"
            : ""
        return `Reverted ${operations.length} change(s)${warning}.`
      },
    ],
  })
}
