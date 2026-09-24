"use client"

import * as React from "react"
import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { Minus, Plus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const counterVariants = cva(
  "inline-flex items-center justify-between border border-border bg-background transition-colors focus-within:border-2 focus-within:border-ring focus-within:ring-0",
  {
    variants: {
      size: {
        default: "h-14 rounded-2xl px-2 text-base",
        sm: "h-10 rounded-xl px-1.5 text-sm",
        lg: "h-16 rounded-2xl px-2.5 text-lg",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const buttonSizeVariants = cva(
  "inline-flex shrink-0 items-center justify-center text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-30 data-disabled:pointer-events-none data-disabled:opacity-30",
  {
    variants: {
      size: {
        default: "size-10 rounded-xl",
        sm: "size-7 rounded-lg",
        lg: "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const iconSizeVariants = cva("shrink-0", {
  variants: {
    size: {
      default: "size-4",
      sm: "size-3.5",
      lg: "size-5",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export interface CounterProps
  extends
    Omit<
      React.ComponentProps<typeof NumberFieldPrimitive.Root>,
      "value" | "defaultValue" | "onChange" | "onValueChange"
    >,
    VariantProps<typeof counterVariants> {
  value?: number | null
  defaultValue?: number
  onValueChange?: (value: number) => void
  onChange?: (value: number) => void
  decrementAriaLabel?: string
  incrementAriaLabel?: string
  inputClassName?: string
}

const Counter = React.forwardRef<HTMLDivElement, CounterProps>(
  (
    {
      className,
      size = "default",
      value,
      defaultValue,
      min = 0,
      max,
      step = 1,
      disabled,
      readOnly,
      onValueChange,
      onChange,
      decrementAriaLabel = "کاهش",
      incrementAriaLabel = "افزایش",
      inputClassName,
      id,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const handleValueChange = React.useCallback(
      (val: number | null) => {
        const resolved = val === null ? (min ?? 0) : val
        onValueChange?.(resolved)
        onChange?.(resolved)
      },
      [min, onValueChange, onChange]
    )

    return (
      <NumberFieldPrimitive.Root
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        readOnly={readOnly}
        onValueChange={handleValueChange}
        id={id}
        className={cn(counterVariants({ size, className }))}
        {...props}
      >
        <NumberFieldPrimitive.Group className="flex w-full items-center justify-between">
          <NumberFieldPrimitive.Decrement
            className={cn(buttonSizeVariants({ size }))}
            aria-label={decrementAriaLabel}
          >
            <Minus className={iconSizeVariants({ size })} aria-hidden="true" />
          </NumberFieldPrimitive.Decrement>

          <NumberFieldPrimitive.Input
            className={cn(
              "min-w-0 flex-1 bg-transparent px-1 text-center font-semibold text-foreground tabular-nums outline-none focus:outline-none",
              size === "sm"
                ? "text-sm"
                : size === "lg"
                  ? "text-lg"
                  : "text-base",
              inputClassName
            )}
            aria-label={ariaLabel}
          />

          <NumberFieldPrimitive.Increment
            className={cn(buttonSizeVariants({ size }))}
            aria-label={incrementAriaLabel}
          >
            <Plus className={iconSizeVariants({ size })} aria-hidden="true" />
          </NumberFieldPrimitive.Increment>
        </NumberFieldPrimitive.Group>
      </NumberFieldPrimitive.Root>
    )
  }
)

Counter.displayName = "Counter"

const NumberField = NumberFieldPrimitive

export { Counter, Counter as CounterInput, NumberField, counterVariants }
