import path from "node:path"

export const repoRoot = process.cwd()
export const templatesDir = path.join(
  repoRoot,
  "turbo",
  "generators",
  "templates"
)
export const templatePath = (...parts: string[]) =>
  path.join(templatesDir, ...parts)

export const normalizeRepoPath = (filePath: string) =>
  path.relative(repoRoot, filePath).replace(/\\/g, "/")
