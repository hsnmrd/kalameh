import os from "node:os"
import path from "node:path"
import dotenv from "dotenv"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Load environment variables from monorepo root
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

// Auto-detect all active IPv4 network interface addresses for local network development
const localIps = Object.values(os.networkInterfaces())
  .flat()
  .filter((iface): iface is os.NetworkInterfaceInfo =>
    Boolean(iface && iface.family === "IPv4" && !iface.internal)
  )
  .map((iface) => iface.address)

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    ...localIps,
    ...localIps.map((ip) => `${ip}:5001`),
    ...(process.env.ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()) ?? []),
  ],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    const backendUrl = process.env.INTERNAL_API_URL || "http://localhost:8000"
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${backendUrl}/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
