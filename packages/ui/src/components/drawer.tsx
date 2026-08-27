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
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card focus:outline-hidden",
          className
        )}
        {...props}
      >
        {showHandle && (
          <div className="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-border" />
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>
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
        "sticky bottom-0 mt-auto flex shrink-0 flex-col gap-2 border-t border-border/60 bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&>button]:h-11 [&>button]:w-full [&>button]:rounded-xl",
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
  className: _className,
  ..._props
}: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Close>) {
  // Mobile bottom sheets must not render a top-corner close 'X' icon in the header.
  return null
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
