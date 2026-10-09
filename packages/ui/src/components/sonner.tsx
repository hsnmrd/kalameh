"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  Toaster as Sonner,
  toast as sonnerToast,
  useSonner,
  type ToastT,
  type ExternalToast,
} from "sonner"
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"

type ToasterProps = Omit<React.ComponentProps<typeof Sonner>, "ref">

function isToastAction(target: Element) {
  return Boolean(target.closest("[data-button], [data-close-button]"))
}

function attachDurationStyle<T extends ExternalToast>(
  options?: T
): T | undefined {
  if (!options) return options
  if (options.duration !== undefined) {
    return {
      ...options,
      style: {
        ...options.style,
        ...(options.duration === Infinity
          ? { "--toast-duration": "0ms" }
          : { "--toast-duration": `${options.duration}ms` }),
      } as React.CSSProperties,
    }
  }
  return options
}

const DEFAULT_TOAST_DURATION = 4000

export function Toaster({
  position = "bottom-center",
  toastOptions,
  dir,
  duration = DEFAULT_TOAST_DURATION,
  icons,
  ...props
}: ToasterProps) {
  const { theme = "system" } = useTheme()
  const { toasts } = useSonner()
  const toasterRef = React.useRef<HTMLElement>(null)
  const [resolvedDir, setResolvedDir] = React.useState<
    "rtl" | "ltr" | "auto" | undefined
  >(dir ?? "auto")

  React.useEffect(() => {
    if (dir) {
      setResolvedDir(dir)
      return
    }

    const updateDirection = () => {
      if (typeof document !== "undefined") {
        const htmlDir = document.documentElement.getAttribute("dir")
        if (htmlDir === "rtl" || htmlDir === "ltr") {
          setResolvedDir(htmlDir)
        } else {
          setResolvedDir("auto")
        }
      }
    }

    updateDirection()

    const observer = new MutationObserver(() => {
      updateDirection()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    })

    return () => observer.disconnect()
  }, [dir])

  const getClickedToast = React.useCallback(
    (target: EventTarget | null): ToastT | undefined => {
      if (!(target instanceof Element) || isToastAction(target)) return

      const toastElement = target.closest<HTMLElement>("[data-sonner-toast]")
      const toasterElement = toastElement?.closest<HTMLElement>(
        "[data-sonner-toaster]"
      )

      if (!toastElement || !toasterElement || !toasterRef.current) return
      if (!toasterRef.current.contains(toastElement)) return

      const index = Number(toastElement.dataset.index)
      const renderedPosition = `${toasterElement.dataset.yPosition}-${toasterElement.dataset.xPosition}`

      if (!Number.isInteger(index)) return

      return toasts
        .filter((item) => {
          const matchesToaster = props.id
            ? item.toasterId === props.id
            : !item.toasterId
          const itemPosition = item.position ?? position

          return matchesToaster && itemPosition === renderedPosition
        })
        .at(index)
    },
    [position, props.id, toasts]
  )

  React.useEffect(() => {
    const toasterElement = toasterRef.current
    if (!toasterElement) return

    const dismissFromTarget = (target: EventTarget | null) => {
      const clickedToast = getClickedToast(target)
      if (clickedToast?.dismissible === false) return
      if (clickedToast) sonnerToast.dismiss(clickedToast.id)
    }

    const handleClick = (event: MouseEvent) => dismissFromTarget(event.target)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return

      const clickedToast = getClickedToast(event.target)
      if (!clickedToast || clickedToast.dismissible === false) return

      event.preventDefault()
      sonnerToast.dismiss(clickedToast.id)
    }

    toasterElement.addEventListener("click", handleClick)
    toasterElement.addEventListener("keydown", handleKeyDown)

    return () => {
      toasterElement.removeEventListener("click", handleClick)
      toasterElement.removeEventListener("keydown", handleKeyDown)
    }
  }, [getClickedToast])

  return (
    <Sonner
      ref={toasterRef}
      theme={theme as ToasterProps["theme"]}
      position={position}
      duration={duration}
      dir={resolvedDir}
      icons={{
        success: <CircleCheck className="size-4 shrink-0 text-success" />,
        error: <CircleAlert className="size-4 shrink-0 text-destructive" />,
        warning: <TriangleAlert className="size-4 shrink-0 text-warning" />,
        info: <Info className="size-4 shrink-0 text-primary" />,
        loading: <Spinner size="sm" className="size-4 shrink-0 text-primary" />,
        close: <X className="size-3.5 shrink-0" />,
        ...icons,
      }}
      className="toaster group font-sans"
      toastOptions={{
        duration,
        ...toastOptions,
        style: {
          "--toast-duration": `${duration}ms`,
          ...toastOptions?.style,
        } as React.CSSProperties,
        classNames: {
          toast:
            "group toast cursor-pointer select-none relative overflow-hidden group-[.toaster]:rounded-2xl group-[.toaster]:border group-[.toaster]:border-border/80 group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:font-sans group-[.toaster]:text-foreground group-[.toaster]:shadow-lg group-[.toaster]:shadow-black/5 group-[.toaster]:px-4 group-[.toaster]:py-3.5 group-[.toaster]:gap-3 group-[.toaster]:transition-all",
          title:
            "group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:text-foreground group-[.toast]:leading-snug group-[.toast]:tracking-tight",
          description:
            "group-[.toast]:text-xs group-[.toast]:text-muted-foreground group-[.toast]:leading-relaxed",
          content:
            "group-[.toast]:flex group-[.toast]:flex-col group-[.toast]:gap-0.5 group-[.toast]:static group-[.toast]:flex-1 group-[.toast]:min-w-0",
          icon: "group-[.toast]:flex group-[.toast]:items-center group-[.toast]:justify-center group-[.toast]:shrink-0",
          actionButton:
            "group-[.toast]:h-8 group-[.toast]:rounded-lg group-[.toast]:bg-primary group-[.toast]:px-3 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:text-primary-foreground group-[.toast]:transition-colors hover:group-[.toast]:bg-primary/90",
          cancelButton:
            "group-[.toast]:h-8 group-[.toast]:rounded-lg group-[.toast]:bg-muted group-[.toast]:px-3 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:text-muted-foreground group-[.toast]:transition-colors hover:group-[.toast]:bg-muted/80 hover:group-[.toast]:text-foreground",
          closeButton:
            "group-[.toast]:top-2.5 group-[.toast]:end-2.5 group-[.toast]:rounded-lg group-[.toast]:p-1 group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground hover:group-[.toast]:bg-muted/50 group-[.toast]:border-0 group-[.toast]:bg-transparent group-[.toast]:transition-colors",
          success:
            "group-[.toaster]:border-success/30 group-[.toaster]:shadow-success/5",
          error:
            "group-[.toaster]:border-destructive/30 group-[.toaster]:shadow-destructive/5",
          warning:
            "group-[.toaster]:border-warning/30 group-[.toaster]:shadow-warning/5",
          info: "group-[.toaster]:border-primary/30 group-[.toaster]:shadow-primary/5",
          loading: "group-[.toaster]:border-border/80",
          default: "group-[.toaster]:border-border/80",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}

export const toast: typeof sonnerToast = new Proxy(sonnerToast, {
  apply(target, thisArg, argArray) {
    const [message, options] = argArray
    return Reflect.apply(target, thisArg, [
      message,
      attachDurationStyle(options),
    ])
  },
  get(target, prop, receiver) {
    const orig = Reflect.get(target, prop, receiver)
    if (typeof orig === "function") {
      if (
        prop === "success" ||
        prop === "error" ||
        prop === "warning" ||
        prop === "info" ||
        prop === "message" ||
        prop === "custom"
      ) {
        return (message: any, options?: ExternalToast) => {
          return orig.call(target, message, attachDurationStyle(options))
        }
      }
      if (prop === "loading") {
        return (message: any, options?: ExternalToast) => {
          return orig.call(target, message, {
            ...options,
            style: {
              ...options?.style,
              "--toast-duration": "0ms",
            } as React.CSSProperties,
          })
        }
      }
      if (prop === "promise") {
        return (promise: any, data?: any) => {
          if (data && typeof data === "object" && data.duration !== undefined) {
            return orig.call(target, promise, {
              ...data,
              style: {
                ...data.style,
                "--toast-duration": `${data.duration}ms`,
              } as React.CSSProperties,
            })
          }
          return orig.call(target, promise, data)
        }
      }
      return orig.bind(target)
    }
    return orig
  },
})
