import * as React from "react"

import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-input",
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-background shadow-lg transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
