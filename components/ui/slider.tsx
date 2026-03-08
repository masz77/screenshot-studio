"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  label?: string
  valueDisplay?: string | number
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  label,
  valueDisplay,
  ...props
}: SliderProps) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  const displayValue = valueDisplay ?? (Array.isArray(value) ? value[0] : value ?? (Array.isArray(defaultValue) ? defaultValue[0] : defaultValue ?? min))

  return (
    <div className={cn(
      "relative w-full rounded-lg bg-secondary dark:bg-background",
      className
    )}>
      {/* Label and value overlaid inside the slider */}
      {(label || displayValue !== undefined) && (
        <div className="absolute inset-0 z-10 flex items-center justify-between px-3 pointer-events-none select-none">
          {label && (
            <span className="text-xs text-muted-foreground">
              {label}
            </span>
          )}
          <span className="text-xs text-muted-foreground tabular-nums ml-auto">
            {displayValue}
          </span>
        </div>
      )}
      <SliderPrimitive.Root
        data-slot="slider"
        defaultValue={defaultValue}
        value={value}
        min={min}
        max={max}
        className={cn(
          "relative flex touch-none select-none items-center cursor-grab w-full h-8",
          "data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col"
        )}
        {...props}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-full w-full grow overflow-hidden rounded-lg"
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            className="absolute h-full bg-border/30 dark:bg-secondary/50 data-[orientation=vertical]:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="block h-5 w-1 rounded-full bg-muted-foreground/50 dark:bg-muted-foreground/40 focus:outline-none transition-colors hover:bg-muted-foreground disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  )
}

export { Slider }
