import type { PlopTypes } from "@turbo/gen"
import fs from "node:fs"
import path from "node:path"

import { normalizeRepoPath, repoRoot } from "./paths"

export type TrackedOperation =
  | { type: "add"; path: string }
  | {
      type: "modify"
      path: string
      before: string
      beforeExisted: boolean
    }

export type TrackingRun = {
  generator: string
  startedAt: string
  operations: TrackedOperation[]
  untracked: string[]
}

type PlopLikeApi = {
  renderString?: (template: string, data: unknown) => string
  getDestBasePath?: () => string
}

export const lastRunPath = path.join(repoRoot, ".turbo", "gen", "last-run.json")

const trackableActionTypes = new Set(["add", "modify", "append"])
let currentRun: TrackingRun | null = null

const readFileIfExists = (filePath: string) => {
  try {
    return fs.readFileSync(filePath, "utf8")
  } catch {
    return null
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const buildRenderData = (data: unknown, cfg: Record<string, unknown>) => {
  const answerData = isRecord(data) ? data : {}
  const extraData = isRecord(cfg.data) ? cfg.data : {}
  if (Object.keys(extraData).length === 0) {
    return answerData
  }
  return { ...answerData, ...extraData }
}

const renderWithPlop = (
  template: string,
  data: unknown,
  cfg: Record<string, unknown>,
  plopApi: unknown
) => {
  const api = plopApi as PlopLikeApi
  if (typeof api.renderString === "function") {
    return api.renderString(template, buildRenderData(data, cfg))
  }
  return template
}

const resolveTemplateFilePath = (templateFile: string) => {
  const candidates = [
    templateFile,
    path.join(repoRoot, templateFile),
    path.join(repoRoot, "turbo", "generators", templateFile),
  ]
  const resolved = candidates.find((candidate) => fs.existsSync(candidate))
  if (!resolved) {
    throw new Error(`Template file not found: ${templateFile}`)
  }
  return resolved
}

export const resolveDestPath = (
  data: unknown,
  cfg: Record<string, unknown>,
  plopApi: unknown
) => {
  if (typeof cfg.path !== "string") {
    throw new Error("Tracked action missing path.")
  }
  const renderedPath = renderWithPlop(cfg.path, data, cfg, plopApi)
  if (path.isAbsolute(renderedPath)) return renderedPath
  const api = plopApi as PlopLikeApi
  const basePath =
    typeof api.getDestBasePath === "function" ? api.getDestBasePath() : repoRoot
  return path.resolve(basePath, renderedPath)
}

const renderActionTemplate = (
  data: unknown,
  cfg: Record<string, unknown>,
  plopApi: unknown
) => {
  if (typeof cfg.template === "string") {
    return renderWithPlop(cfg.template, data, cfg, plopApi)
  }
  if (typeof cfg.templateFile === "string") {
    const filePath = resolveTemplateFilePath(cfg.templateFile)
    const template = fs.readFileSync(filePath, "utf8")
    return renderWithPlop(template, data, cfg, plopApi)
  }
  return ""
}

const runAddAction = async (
  data: unknown,
  cfg: Record<string, unknown>,
  plopApi: unknown
) => {
  const destPath = resolveDestPath(data, cfg, plopApi)
  if (fs.existsSync(destPath)) {
    if (cfg.skipIfExists === true) {
      return `skipped ${normalizeRepoPath(destPath)}`
    }
    if (cfg.force !== true) {
      throw new Error(`File already exists: ${normalizeRepoPath(destPath)}`)
    }
  }

  const content = renderActionTemplate(data, cfg, plopApi)
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.writeFileSync(destPath, content, "utf8")
  return `add ${normalizeRepoPath(destPath)}`
}

const runAppendAction = async (
  data: unknown,
  cfg: Record<string, unknown>,
  plopApi: unknown
) => {
  const destPath = resolveDestPath(data, cfg, plopApi)
  if (!fs.existsSync(destPath)) {
    throw new Error(
      `Cannot append to missing file: ${normalizeRepoPath(destPath)}`
    )
  }

  const original = fs.readFileSync(destPath, "utf8")
  const chunk = renderActionTemplate(data, cfg, plopApi)
  const separator = typeof cfg.separator === "string" ? cfg.separator : "\n"
  let next = original

  if (cfg.pattern instanceof RegExp) {
    const regex = new RegExp(
      cfg.pattern.source,
      cfg.pattern.flags.replace(/g/u, "")
    )
    const match = regex.exec(original)
    if (!match || typeof match.index !== "number") {
      throw new Error(
        `Append pattern not found in ${normalizeRepoPath(destPath)}`
      )
    }
    const insertAt = match.index + match[0].length
    const prefix = original.slice(0, insertAt)
    const needsSeparator =
      separator.length > 0 && prefix.length > 0 && !prefix.endsWith(separator)
    next = `${prefix}${needsSeparator ? separator : ""}${chunk}${original.slice(insertAt)}`
  } else {
    const needsSeparator =
      separator.length > 0 &&
      original.length > 0 &&
      !original.endsWith(separator)
    next = `${original}${needsSeparator ? separator : ""}${chunk}`
  }

  if (next !== original) {
    fs.writeFileSync(destPath, next, "utf8")
  }
  return `append ${normalizeRepoPath(destPath)}`
}

const runModifyAction = async (
  data: unknown,
  cfg: Record<string, unknown>,
  plopApi: unknown
) => {
  const destPath = resolveDestPath(data, cfg, plopApi)
  if (!fs.existsSync(destPath)) {
    throw new Error(
      `Cannot modify missing file: ${normalizeRepoPath(destPath)}`
    )
  }

  const original = fs.readFileSync(destPath, "utf8")
  let next = original

  if (typeof cfg.transform === "function") {
    next = String(await cfg.transform(original, data, plopApi))
  } else if (cfg.pattern instanceof RegExp) {
    const replacement = renderActionTemplate(data, cfg, plopApi)
    next = original.replace(cfg.pattern, replacement)
  } else {
    throw new Error(
      `Unsupported modify action for ${normalizeRepoPath(destPath)}`
    )
  }

  if (next !== original) {
    fs.writeFileSync(destPath, next, "utf8")
  }
  return `modify ${normalizeRepoPath(destPath)}`
}

const runTrackedAction = async (
  actionType: string,
  data: unknown,
  cfg: Record<string, unknown>,
  plopApi: unknown
) => {
  if (actionType === "add") return runAddAction(data, cfg, plopApi)
  if (actionType === "append") return runAppendAction(data, cfg, plopApi)
  if (actionType === "modify") return runModifyAction(data, cfg, plopApi)
  throw new Error(`Unsupported tracked action type: ${actionType}`)
}

const startTracking = (generatorName: string) => {
  currentRun = {
    generator: generatorName,
    startedAt: new Date().toISOString(),
    operations: [],
    untracked: [],
  }
}

const recordUntracked = (action: PlopTypes.ActionType) => {
  if (!currentRun) return
  if (action && typeof action === "object" && "type" in action) {
    const actionType = String((action as { type?: unknown }).type ?? "unknown")
    const actionPath =
      "path" in action && typeof action.path === "string" ? action.path : ""
    currentRun.untracked.push(
      actionPath ? `${actionType}:${actionPath}` : actionType
    )
  } else {
    currentRun.untracked.push("unknown")
  }
}

export const withTracking = (
  generatorName: string,
  actions: PlopTypes.ActionType[]
) => {
  startTracking(generatorName)
  const wrapped = actions.map((action) => {
    if (typeof action === "string" || typeof action === "function") {
      return action
    }
    if (!action || typeof action !== "object") return action
    const actionType =
      "type" in action && typeof action.type === "string" ? action.type : ""
    if (!actionType) return action
    if (actionType === "track" || actionType === "track-finalize") {
      return action
    }
    if (trackableActionTypes.has(actionType)) {
      const base = action as unknown as Record<string, unknown>
      return {
        type: "track",
        action: base,
        data: base.data,
        skip: base.skip,
        abortOnFail: base.abortOnFail,
        force: base.force,
      } as PlopTypes.ActionType
    }
    recordUntracked(action)
    return action
  })
  wrapped.push({ type: "track-finalize" })
  return wrapped
}

export const registerTrackingActions = (plop: PlopTypes.NodePlopAPI) => {
  plop.setActionType("track", async (data, cfg, plopApi) => {
    if (!currentRun) {
      throw new Error("Tracking is not initialized.")
    }
    const tracked = (cfg as { action?: Record<string, unknown> }).action
    if (!tracked || typeof tracked.type !== "string") {
      throw new Error("Invalid tracked action.")
    }

    const actionType = tracked.type
    const innerCfg = {
      ...tracked,
      force:
        typeof (cfg as { force?: unknown }).force === "boolean"
          ? (cfg as { force?: boolean }).force
          : tracked.force,
    } as Record<string, unknown>

    if (!("path" in innerCfg) || typeof innerCfg.path !== "string") {
      throw new Error(`Tracked action missing path: ${actionType}`)
    }

    const destPath = resolveDestPath(data, innerCfg, plopApi)
    const beforeExisted = fs.existsSync(destPath)
    const before = beforeExisted ? readFileIfExists(destPath) : null

    if (actionType === "add") {
      const result = await runTrackedAction(actionType, data, innerCfg, plopApi)
      const afterExisted = fs.existsSync(destPath)
      const after = afterExisted ? readFileIfExists(destPath) : null
      const relativePath = normalizeRepoPath(destPath)

      if (!beforeExisted && afterExisted) {
        currentRun.operations.push({ type: "add", path: relativePath })
      } else if (beforeExisted && before !== after) {
        currentRun.operations.push({
          type: "modify",
          path: relativePath,
          before: before ?? "",
          beforeExisted: true,
        })
      }

      return result
    }

    if (actionType === "modify" || actionType === "append") {
      const result = await runTrackedAction(actionType, data, innerCfg, plopApi)
      const afterExisted = fs.existsSync(destPath)
      const after = afterExisted ? readFileIfExists(destPath) : null
      const relativePath = normalizeRepoPath(destPath)

      if (before !== after) {
        currentRun.operations.push({
          type: "modify",
          path: relativePath,
          before: before ?? "",
          beforeExisted,
        })
      }

      return result
    }

    throw new Error(`Unsupported tracked action type: ${actionType}`)
  })

  plop.setActionType("track-finalize", async () => {
    if (!currentRun) return "No tracking run."
    fs.mkdirSync(path.dirname(lastRunPath), { recursive: true })
    fs.writeFileSync(lastRunPath, JSON.stringify(currentRun, null, 2))
    const summary = `${currentRun.operations.length} change(s) recorded`
    currentRun = null
    return summary
  })
}
