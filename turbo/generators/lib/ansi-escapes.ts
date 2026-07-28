import { createRequire } from "node:module"
import path from "node:path"

import { repoRoot } from "./paths"

type AnsiEscapes = {
  cursorLeft: string
  cursorForward: (count: number) => string
  cursorUp: (count: number) => string
  eraseDown: string
}

const require = createRequire(path.join(repoRoot, "package.json"))
const ansiEscapes = require("ansi-escapes") as AnsiEscapes

export default ansiEscapes
