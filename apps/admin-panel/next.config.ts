import path from "node:path"
import dotenv from "dotenv"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Load environment variables from monorepo root
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

export default withNextIntl(nextConfig)
