"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

const Drawer = DrawerPrimitive.Root
const DrawerTrigger: React.FC<
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Trigger>
> = DrawerPrimitive.Trigger
const DrawerPortal = DrawerPrimitive.Portal
const DrawerClose: React.FC<
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Close>
> = DrawerPrimitive.Close

function DrawerOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  showHandle = true,
  ...props
}: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
  showHandle?: boolean
}) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl border border-border bg-card focus:outline-hidden",
          className
        )}
        {...props}
      >
        {showHandle && (
          <div className="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-border" />
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 px-4 pt-3 pb-2", className)}
      {...props}
    />
  )
}

function DrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "pb-safe-or-4 mt-auto flex flex-col gap-2 px-4 pt-2",
        className
      )}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <DrawerPrimitive.Title
      className={cn(
        "text-base leading-none font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <DrawerPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function DrawerCloseButton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Close>) {
  return (
    <DrawerPrimitive.Close
      className={cn(
        "absolute end-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-ring focus:outline-hidden",
        className
      )}
      {...props}
    >
      <X className="size-4" />
      <span className="sr-only">Close</span>
    </DrawerPrimitive.Close>
  )
}

export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerCloseButton,
}
