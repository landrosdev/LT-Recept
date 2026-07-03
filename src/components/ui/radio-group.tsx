import * as React from "react"
import { cn } from "@/lib/utils"

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div
          className={cn("grid gap-2", className)}
          {...props}
          ref={ref}
        />
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

export interface RadioGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const checked = context.value === value

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={checked}
        onClick={(e) => {
          context.onValueChange?.(value)
          props.onClick?.(e)
        }}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          checked && "bg-primary",
          className
        )}
        {...props}
      >
        {checked && (
          <div className="flex items-center justify-center h-full w-full">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
        )}
      </button>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
