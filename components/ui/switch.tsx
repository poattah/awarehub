"use client"

import * as React from "react"
import clsx from "clsx"

type SwitchProps = React.InputHTMLAttributes<HTMLInputElement> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({ className, checked, onCheckedChange, ...props }: SwitchProps) {
  return (
    <label className={clsx("inline-flex items-center cursor-pointer", className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <div className="peer h-5 w-9 rounded-full border border-border/60 bg-muted transition peer-checked:bg-primary peer-checked:border-primary flex items-center px-0.5">
        <div className="h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
      </div>
    </label>
  )
}
