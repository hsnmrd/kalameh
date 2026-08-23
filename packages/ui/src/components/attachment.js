"use client"
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import * as React from "react"
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
export function Attachment({
  value,
  onChange,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  maxSizeMb = 5,
  disabled = false,
  className,
  placeholder = "Upload an image or logo",
  description = "PNG, JPG, WEBP or SVG (Max 5MB)",
  removeLabel = "Remove",
}) {
  const inputRef = React.useRef(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [fileName, setFileName] = React.useState(null)
  const previewSrc = React.useMemo(() => {
    if (!value) return null
    if (typeof value === "string") return value
    if (typeof window !== "undefined" && value instanceof File) {
      return URL.createObjectURL(value)
    }
    return null
  }, [value])
  React.useEffect(() => {
    return () => {
      if (
        previewSrc &&
        typeof value !== "string" &&
        typeof window !== "undefined"
      ) {
        URL.revokeObjectURL(previewSrc)
      }
    }
  }, [previewSrc, value])
  const displayName = React.useMemo(() => {
    if (fileName) return fileName
    if (typeof value === "object" && value instanceof File) return value.name
    if (typeof value === "string") {
      const parts = value.split("/")
      return parts[parts.length - 1] || "Image"
    }
    return "Image"
  }, [fileName, value])
  const processFile = (file) => {
    setError(null)
    const maxSizeBytes = maxSizeMb * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds limit (${maxSizeMb}MB)`)
      return
    }
    setFileName(file.name)
    onChange?.(file)
  }
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }
  const handleRemove = (e) => {
    e.stopPropagation()
    setFileName(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    onChange?.(null)
  }
  const triggerSelect = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }
  return _jsxs("div", {
    className: cn("w-full space-y-2", className),
    children: [
      _jsx("input", {
        ref: inputRef,
        type: "file",
        accept: accept,
        disabled: disabled,
        onChange: handleFileChange,
        className: "hidden",
        "aria-hidden": "true",
        tabIndex: -1,
      }),
      previewSrc
        ? _jsxs("div", {
            className:
              "relative flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3 shadow-2xs transition-all",
            children: [
              _jsxs("div", {
                className: "flex min-w-0 items-center gap-3",
                children: [
                  _jsx("div", {
                    className:
                      "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/60",
                    children: _jsx("img", {
                      src: previewSrc,
                      alt: displayName || "Attachment preview",
                      className: "size-full object-contain p-1",
                    }),
                  }),
                  _jsxs("div", {
                    className: "min-w-0 flex-1",
                    children: [
                      _jsx("p", {
                        className:
                          "truncate text-xs font-semibold text-foreground",
                        children: displayName,
                      }),
                      _jsx("p", {
                        className: "truncate text-[11px] text-muted-foreground",
                        children: description,
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  _jsxs(Button, {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    disabled: disabled,
                    onClick: triggerSelect,
                    className: "h-8 rounded-lg px-3 text-xs",
                    children: [
                      _jsx(Upload, { className: "me-1 size-3.5" }),
                      "Change",
                    ],
                  }),
                  _jsx(Button, {
                    type: "button",
                    variant: "ghost",
                    size: "sm",
                    disabled: disabled,
                    onClick: handleRemove,
                    className:
                      "size-8 rounded-lg p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                    "aria-label": removeLabel,
                    children: _jsx(X, { className: "size-4" }),
                  }),
                ],
              }),
            ],
          })
        : _jsxs("div", {
            role: "button",
            tabIndex: disabled ? -1 : 0,
            onClick: triggerSelect,
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                triggerSelect()
              }
            },
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
            className: cn(
              "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
              disabled && "cursor-not-allowed opacity-60"
            ),
            children: [
              _jsx("div", {
                className:
                  "flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform group-hover:scale-105",
                children: _jsx(ImageIcon, { className: "size-5" }),
              }),
              _jsxs("div", {
                className: "mt-2 space-y-0.5",
                children: [
                  _jsx("p", {
                    className: "text-xs font-medium text-foreground",
                    children: placeholder,
                  }),
                  _jsx("p", {
                    className: "text-[11px] text-muted-foreground",
                    children: description,
                  }),
                ],
              }),
            ],
          }),
      error &&
        _jsxs("div", {
          className: "flex items-center gap-1.5 text-xs text-destructive",
          children: [
            _jsx(AlertCircle, { className: "size-3.5 shrink-0" }),
            _jsx("span", { children: error }),
          ],
        }),
    ],
  })
}
