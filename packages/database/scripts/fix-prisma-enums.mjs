import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDir = path.resolve(__dirname, "../src/generated/client")

for (const file of ["client.ts", "browser.ts"]) {
  const filePath = path.join(clientDir, file)
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8")
    if (content.includes("export * as $Enums from './enums.js'")) {
      content = content.replace(
        /export \* as \$Enums from '\.\/enums\.js'/g,
        "import * as $Enums from './enums.js'; export { $Enums };"
      )
      fs.writeFileSync(filePath, content, "utf8")
      console.log(`[fix-prisma-enums] Transformed export namespace in ${file}`)
    }
  }
}
