"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

// Define the custom props for our Progress component
// It extends the standard Radix Progress props and adds our custom one.
interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    // Base styles for the progress bar's track
    className={`relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${className || ''}`}
    {...props}
  >
    <ProgressPrimitive.Indicator
      // Base styles for the progress bar's "fill"
      // It intelligently combines with the custom 'indicatorClassName' you can pass
      className={`h-full w-full flex-1 transition-all ${indicatorClassName || 'bg-slate-900 dark:bg-slate-50'}`}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }