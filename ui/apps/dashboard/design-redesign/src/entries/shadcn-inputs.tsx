import * as React from "react"
import { createRoot } from "react-dom/client"
import { SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface ShadcnSearchInputOptions {
  ariaLabel: string
  className?: string
  clearable?: boolean
  placeholder?: string
  value?: string
}

export interface ShadcnSearchInputApi {
  focus: () => void
  onValueChange?: (value: string) => void
  setValue: (value: string, emit?: boolean) => void
  readonly value: string
}

function MountedSearchInput({
  ariaLabel,
  className,
  clearable,
  placeholder,
  value,
  onChange,
  onClear,
  inputRef,
}: ShadcnSearchInputOptions & {
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onClear: () => void
}) {
  return (
    <div className={cn("shadcn-search-input", className)} data-slot="input-group">
      <SearchIcon aria-hidden="true" />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {clearable && value ? (
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Clear search" onClick={onClear}>
          <XIcon aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  )
}

window.mountShadcnSearchInput = (element, options) => {
  let value = options.value || ""
  const inputRef = React.createRef<HTMLInputElement>()
  const root = createRoot(element)

  const api: ShadcnSearchInputApi = {
    get value() {
      return value
    },
    focus() {
      inputRef.current?.focus()
    },
    setValue(nextValue, emit = true) {
      value = nextValue
      render()
      if (emit) api.onValueChange?.(value)
    },
  }

  function render() {
    root.render(
      <MountedSearchInput
        {...options}
        value={value}
        inputRef={inputRef}
        onChange={(nextValue) => api.setValue(nextValue)}
        onClear={() => {
          api.setValue("")
          requestAnimationFrame(() => api.focus())
        }}
      />
    )
  }

  render()
  return api
}

window.dispatchEvent(new CustomEvent("shadcn-inputs-ready"))
