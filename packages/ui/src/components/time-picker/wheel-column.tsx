"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { safeScrollTo } from "./helpers"
import type { WheelItem, WheelColumnProps } from "./types"

export type { WheelItem, WheelColumnProps }

export function WheelColumn<T = string | number>({
  items,
  value,
  onChange,
  itemHeight = 40,
  visibleCount = 5,
  className,
  ariaLabel,
}: WheelColumnProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isScrollingProgrammatically = React.useRef(false)
  const scrollTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedIndex = React.useMemo(() => {
    const idx = items.findIndex((it) => it.value === value)
    return idx >= 0 ? idx : 0
  }, [items, value])

  const [visualIndex, setVisualIndex] = React.useState(selectedIndex)
  const [prevValue, setPrevValue] = React.useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    setVisualIndex(selectedIndex)
  }

  const scrollToIndex = React.useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current
      if (!container) return
      const targetTop = index * itemHeight
      if (Math.abs(container.scrollTop - targetTop) > 1) {
        isScrollingProgrammatically.current = true
        safeScrollTo(container, targetTop, behavior)
        setTimeout(
          () => {
            isScrollingProgrammatically.current = false
          },
          behavior === "smooth" ? 220 : 50
        )
      }
    },
    [itemHeight]
  )

  // Scroll to selected index on mount or when value changes
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (container.clientHeight > 0) {
      container.scrollTop = selectedIndex * itemHeight
    } else {
      const raf = requestAnimationFrame(() => {
        if (container && container.clientHeight > 0) {
          container.scrollTop = selectedIndex * itemHeight
        }
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [selectedIndex, itemHeight])

  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return
    const currentScrollTop = container.scrollTop
    const nearestIndex = Math.max(
      0,
      Math.min(items.length - 1, Math.round(currentScrollTop / itemHeight))
    )

    if (nearestIndex !== visualIndex) {
      setVisualIndex(nearestIndex)
    }

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }

    scrollTimeout.current = setTimeout(() => {
      if (!isScrollingProgrammatically.current) {
        const finalIndex = Math.max(
          0,
          Math.min(
            items.length - 1,
            Math.round(container.scrollTop / itemHeight)
          )
        )
        const selected = items[finalIndex]
        if (selected && !selected.disabled && selected.value !== value) {
          onChange(selected.value)
        }
      }
    }, 100)
  }

  // Pointer drag support for desktop & mobile consistency
  const pointerState = React.useRef({
    isDown: false,
    startY: 0,
    startScrollTop: 0,
    hasMoved: false,
  })

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const container = containerRef.current
    if (!container) return

    pointerState.current = {
      isDown: true,
      startY: e.clientY,
      startScrollTop: container.scrollTop,
      hasMoved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerState.current.isDown) return
    const container = containerRef.current
    if (!container) return

    const deltaY = e.clientY - pointerState.current.startY
    if (Math.abs(deltaY) > 4) {
      pointerState.current.hasMoved = true
    }
    container.scrollTop = pointerState.current.startScrollTop - deltaY
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerState.current.isDown) return
    pointerState.current.isDown = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    const container = containerRef.current
    if (!container) return

    if (pointerState.current.hasMoved) {
      const snapIndex = Math.max(
        0,
        Math.min(items.length - 1, Math.round(container.scrollTop / itemHeight))
      )
      scrollToIndex(snapIndex, "smooth")
      const selected = items[snapIndex]
      if (selected && !selected.disabled && selected.value !== value) {
        onChange(selected.value)
      }
    }
  }

  const handleItemClick = (index: number) => {
    const item = items[index]
    if (!item || item.disabled) return
    scrollToIndex(index, "smooth")
    setVisualIndex(index)
    onChange(item.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let targetIndex = visualIndex
    if (e.key === "ArrowDown") {
      targetIndex = Math.min(items.length - 1, visualIndex + 1)
    } else if (e.key === "ArrowUp") {
      targetIndex = Math.max(0, visualIndex - 1)
    } else if (e.key === "PageDown") {
      targetIndex = Math.min(items.length - 1, visualIndex + 5)
    } else if (e.key === "PageUp") {
      targetIndex = Math.max(0, visualIndex - 5)
    } else if (e.key === "Home") {
      targetIndex = 0
    } else if (e.key === "End") {
      targetIndex = items.length - 1
    } else {
      return
    }

    e.preventDefault()
    const selected = items[targetIndex]
    if (selected && !selected.disabled) {
      scrollToIndex(targetIndex, "smooth")
      setVisualIndex(targetIndex)
      if (selected.value !== value) {
        onChange(selected.value)
      }
    }
  }

  const paddingY = Math.floor((visibleCount - 1) / 2) * itemHeight

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="listbox"
      aria-label={ariaLabel}
      onScroll={handleScroll}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      style={{
        height: visibleCount * itemHeight,
        paddingTop: paddingY,
        paddingBottom: paddingY,
      }}
      className={cn(
        "relative w-full touch-pan-y snap-y snap-mandatory overflow-x-hidden overflow-y-auto outline-hidden select-none",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {items.map((item, index) => {
        const distance = Math.abs(index - visualIndex)
        const isSelected = distance === 0

        return (
          <button
            key={String(item.value)}
            type="button"
            tabIndex={-1}
            disabled={item.disabled}
            onClick={() => handleItemClick(index)}
            style={{ height: itemHeight }}
            className={cn(
              "flex w-full cursor-pointer snap-center items-center justify-center outline-hidden transition-all duration-150 select-none",
              item.disabled && "cursor-not-allowed opacity-15",
              !item.disabled &&
                distance === 0 &&
                "scale-100 text-2xl font-bold text-foreground opacity-100",
              !item.disabled &&
                distance === 1 &&
                "scale-[0.96] text-base font-medium text-muted-foreground/70 opacity-60",
              !item.disabled &&
                distance === 2 &&
                "scale-[0.92] text-sm font-normal text-muted-foreground/35 opacity-30",
              !item.disabled &&
                distance >= 3 &&
                "scale-[0.88] text-xs font-light text-muted-foreground/15 opacity-15"
            )}
            aria-selected={isSelected}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
