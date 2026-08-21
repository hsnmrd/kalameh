import { Geist_Mono } from "next/font/google"
import Link from "next/link"
import { FileQuestion, Home } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { buttonVariants } from "@workspace/ui/components/button"
import "@workspace/ui/globals.css"

const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export default function GlobalNotFound() {
  return (
    <html lang="en" className={cn("font-mono antialiased", fontMono.variable)}>
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-slate-900">
        <div className="flex w-full max-w-sm flex-col items-center justify-center space-y-6 text-center">
          {/* Icon */}
          <div className="flex size-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-xs">
            <FileQuestion className="size-8 stroke-[1.5]" />
          </div>

          {/* Big 404 */}
          <div className="space-y-1">
            <span className="font-mono text-7xl font-black tracking-tight text-slate-900 sm:text-8xl">
              404
            </span>
          </div>

          {/* Home Icon Button */}
          <div className="pt-2">
            <Link
              href="/"
              aria-label="Home"
              title="Home"
              className={cn(
                buttonVariants({ size: "icon" }),
                "size-12 rounded-2xl bg-slate-900 text-white shadow-xs hover:bg-slate-800 active:scale-95"
              )}
            >
              <Home className="size-5" />
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
