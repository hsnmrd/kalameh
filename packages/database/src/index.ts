import path from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/client/client.js"

// Ensure environment variables from root .env are loaded
if (!process.env.DATABASE_URL) {
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    dotenv.config({ path: path.resolve(currentDir, "../../../.env") })
    dotenv.config({ path: path.resolve(currentDir, "../../.env") })
  } catch {
    // fallback if import.meta.url is not available
  }
  dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
  dotenv.config({ path: path.resolve(process.cwd(), "../.env") })
  dotenv.config({ path: path.resolve(process.cwd(), ".env") })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export * from "./generated/client/client.js"
