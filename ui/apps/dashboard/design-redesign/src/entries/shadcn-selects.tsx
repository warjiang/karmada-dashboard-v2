import * as React from "react"
import { createRoot } from "react-dom/client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface ShadcnSelectOption {
  disabled?: boolean
  group?: string
  label: string
  value: string
}

export interface ShadcnSelectMountOptions {
  ariaLabel?: string
  ariaLabelledBy?: string
  contentClassName?: string
  disabled?: boolean
  options: ShadcnSelectOption[]
  placeholder?: string
  triggerClassName?: string
  value: string
}

export interface ShadcnSelectApi {
  onValueChange?: (value: string) => void
  setDisabled: (disabled: boolean) => void
  setOptions: (options: ShadcnSelectOption[], preferredValue?: string) => void
  setValue: (value: string, emit?: boolean) => void
  readonly value: string
}

interface SelectState extends ShadcnSelectMountOptions {}

const EMPTY_VALUE = "__karmada_empty_select_value__"
const encodeValue = (value: string) => (value === "" ? EMPTY_VALUE : value)
const decodeValue = (value: string) => (value === EMPTY_VALUE ? "" : value)

function groupOptions(options: ShadcnSelectOption[]) {
  const groups = new Map<string, ShadcnSelectOption[]>()
  options.forEach((option) => {
    const key = option.group || ""
    groups.set(key, [...(groups.get(key) || []), option])
  })
  return [...groups.entries()]
}

function MountedSelect({
  subscribe,
  getSnapshot,
  onValueChange,
}: {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => SelectState
  onValueChange: (value: string) => void
}) {
  const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return (
    <Select
      value={encodeValue(state.value)}
      disabled={state.disabled}
      onValueChange={(value) => onValueChange(decodeValue(value))}
    >
      <SelectTrigger
        className={cn("shadcn-real-select-trigger", state.triggerClassName)}
        aria-label={state.ariaLabel}
        aria-labelledby={state.ariaLabelledBy}
      >
        <SelectValue placeholder={state.placeholder || "Select an option"} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        className={cn("shadcn-real-select-content", state.contentClassName)}
      >
        {groupOptions(state.options).map(([group, options]) => (
          <SelectGroup key={group || "default"}>
            {group && <SelectLabel>{group}</SelectLabel>}
            {options.map((option) => (
              <SelectItem
                key={`${group}:${option.value}`}
                value={encodeValue(option.value)}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

window.mountShadcnSelect = (element, initialOptions) => {
  let state: SelectState = {
    ...initialOptions,
    options: initialOptions.options.map((option) => ({ ...option })),
  }
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())
  const update = (nextState: Partial<SelectState>) => {
    state = { ...state, ...nextState }
    notify()
  }

  const api: ShadcnSelectApi = {
    get value() {
      return state.value
    },
    setValue(value, emit = true) {
      update({ value })
      if (emit) api.onValueChange?.(value)
    },
    setOptions(options, preferredValue = state.value) {
      const nextValue = options.some((option) => option.value === preferredValue)
        ? preferredValue
        : options[0]?.value || ""
      update({ options: options.map((option) => ({ ...option })), value: nextValue })
    },
    setDisabled(disabled) {
      update({ disabled })
    },
  }

  createRoot(element).render(
    <MountedSelect
      subscribe={(listener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      }}
      getSnapshot={() => state}
      onValueChange={(value) => api.setValue(value)}
    />
  )

  return api
}

function nativeOptions(select: HTMLSelectElement): ShadcnSelectOption[] {
  return [...select.children].flatMap((child) => {
    if (child instanceof HTMLOptGroupElement) {
      return [...child.querySelectorAll("option")].map((option) => ({
        value: option.value,
        label: option.textContent || option.value,
        group: child.label,
        disabled: option.disabled,
      }))
    }
    if (child instanceof HTMLOptionElement) {
      return [{
        value: child.value,
        label: child.textContent || child.value,
        group: "",
        disabled: child.disabled,
      }]
    }
    return []
  })
}

const enhancedNativeSelects = new WeakSet<HTMLSelectElement>()

function enhanceNativeSelect(select: HTMLSelectElement) {
  if (
    enhancedNativeSelects.has(select) ||
    select.multiple ||
    select.closest('[data-slot="select"]') ||
    select.getAttribute("aria-hidden") === "true" ||
    select.classList.contains("shadcn-native-select")
  ) return

  const host = document.createElement("div")
  host.className = "native-shadcn-select-host"
  select.after(host)
  select.classList.add("native-shadcn-select-source")
  select.hidden = true
  select.tabIndex = -1
  select.setAttribute("aria-hidden", "true")

  const api = window.mountShadcnSelect?.(host, {
    value: select.value,
    options: nativeOptions(select),
    disabled: select.disabled,
    ariaLabel:
      select.getAttribute("aria-label") ||
      select.name ||
      select.closest("label")?.querySelector(":scope > span")?.textContent ||
      "Select an option",
    triggerClassName: cn(
      select.className.replace("native-shadcn-select-source", ""),
      "native-shadcn-select-trigger"
    ),
  })
  if (!api) return

  api.onValueChange = (value) => {
    if (select.value === value) return
    select.value = value
    select.dispatchEvent(new Event("input", { bubbles: true }))
    select.dispatchEvent(new Event("change", { bubbles: true }))
  }
  select.addEventListener("change", () => api.setValue(select.value, false))
  select.form?.addEventListener("reset", () =>
    queueMicrotask(() => api.setValue(select.value, false))
  )
  enhancedNativeSelects.add(select)
}

function scanNativeSelects(root: ParentNode) {
  if (root instanceof HTMLSelectElement) enhanceNativeSelect(root)
  root.querySelectorAll<HTMLSelectElement>("select").forEach(enhanceNativeSelect)
}

scanNativeSelects(document)

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) scanNativeSelects(node)
    })
    if (mutation.target instanceof HTMLSelectElement && enhancedNativeSelects.has(mutation.target)) {
      mutation.target.dispatchEvent(new Event("change", { bubbles: false }))
    }
  })
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
})

window.dispatchEvent(new CustomEvent("shadcn-selects-ready"))
