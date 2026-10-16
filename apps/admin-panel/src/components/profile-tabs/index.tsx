"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import { cn } from "@workspace/ui/lib/utils"

export interface ProfileTabOption<T extends string = string> {
  key: T
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface ProfileTabsProps<T extends string = string> {
  options: ProfileTabOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function ProfileTabs<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: ProfileTabsProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [api, setApi] = React.useState<CarouselApi>()

  const selectedIndex = React.useMemo(
    () => options.findIndex((opt) => opt.key === value),
    [options, value]
  )

  React.useEffect(() => {
    if (!api || selectedIndex < 0) return
    api.scrollTo(selectedIndex)
  }, [api, selectedIndex])

  const handleTabClick = (key: T, index: number) => {
    onChange(key)
    api?.scrollTo(index)
    if (typeof window !== "undefined" && containerRef.current) {
      const headerOffset = 64 // AdminHeader height is 64px (h-16)
      const rect = containerRef.current.getBoundingClientRect()
      const scrollTarget = window.pageYOffset + rect.top - headerOffset
      window.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: "smooth",
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "sticky top-16 z-20 -mx-4 w-[calc(100%+2rem)] border-y border-border/60 bg-background/95 px-4 py-2 backdrop-blur-md sm:mx-0 sm:w-full sm:px-0",
        className
      )}
    >
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          containScroll: "trimSnaps",
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ms-2">
          {options.map((option, index) => {
            const isSelected = value === option.key
            return (
              <CarouselItem key={option.key} className="basis-auto ps-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleTabClick(option.key, index)}
                  className={cn(
                    "h-11 shrink-0 cursor-pointer gap-2 rounded-xl px-4 text-sm font-medium transition-all select-none",
                    isSelected
                      ? "border border-border/80 bg-muted font-semibold text-foreground shadow-xs hover:bg-muted hover:text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {option.icon}
                  <span>{option.label}</span>
                  {typeof option.count === "number" && (
                    <span
                      className={cn(
                        "ms-1 rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                        isSelected
                          ? "border border-border/60 bg-background text-foreground shadow-2xs"
                          : "bg-muted/80 text-muted-foreground"
                      )}
                    >
                      {option.count}
                    </span>
                  )}
                </Button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
