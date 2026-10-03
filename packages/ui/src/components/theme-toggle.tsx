"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Laptop } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface ThemeToggleProps extends React.ComponentPropsWithoutRef<
  typeof Button
> {
  showLabel?: boolean
  labels?: {
    light?: string
    dark?: string
    system?: string
  }
}

/**
 * Accessible theme switcher component driven purely by CSS variables.
 * Cycles through light, dark, and system modes.
 */
export function ThemeToggle({
  className,
  showLabel = false,
  labels = {
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  ...props
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  // Prevent SSR layout/icon shift before mount
  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className={cn(
          "h-8 gap-1.5 border-border bg-background text-muted-foreground opacity-60",
          className
        )}
        {...props}
      >
        <Sun className="size-3.5" />
        {showLabel && <span className="text-xs">...</span>}
      </Button>
    )
  }

  const currentIcon =
    theme === "dark" ? (
      <Moon className="size-3.5" />
    ) : theme === "light" ? (
      <Sun className="size-3.5" />
    ) : (
      <Laptop className="size-3.5" />
    )

  const currentLabel =
    theme === "dark"
      ? labels.dark
      : theme === "light"
        ? labels.light
        : labels.system

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className={cn(
        "h-8 cursor-pointer gap-1.5 border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted active:scale-95",
        className
      )}
      title={`Theme: ${currentLabel}`}
      aria-label={`Toggle theme (current: ${currentLabel})`}
      {...props}
    >
      {currentIcon}
      {showLabel && <span>{currentLabel}</span>}
    </Button>
  )
}
