"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast, useSonner, type ToastT } from "sonner"

type ToasterProps = Omit<React.ComponentProps<typeof Sonner>, "ref">

function isToastAction(target: Element) {
  return Boolean(target.closest("[data-button], [data-close-button]"))
}

export function Toaster({
  position = "bottom-center",
  toastOptions,
  ...props
}: ToasterProps) {
  const { theme = "system" } = useTheme()
  const { toasts } = useSonner()
  const toasterRef = React.useRef<HTMLElement>(null)

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
      if (clickedToast) toast.dismiss(clickedToast.id)
    }

    const handleClick = (event: MouseEvent) => dismissFromTarget(event.target)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return

      const clickedToast = getClickedToast(event.target)
      if (!clickedToast || clickedToast.dismissible === false) return

      event.preventDefault()
      toast.dismiss(clickedToast.id)
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
      className="toaster group font-sans"
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...toastOptions?.classNames,
          toast:
            "group toast cursor-pointer group-[.toaster]:rounded-xl group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:font-sans group-[.toaster]:text-foreground group-[.toaster]:shadow-lg",
          description:
            "group-[.toast]:text-muted-foreground group-[.toast]:font-sans",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-sans",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:font-sans",
          error:
            "group-[.toaster]:border-destructive/20 group-[.toaster]:text-destructive",
        },
      }}
      {...props}
    />
  )
}

export { toast }
