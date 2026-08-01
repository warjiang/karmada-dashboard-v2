import { createRoot, type Root } from "react-dom/client"
import { PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MountedControl {
  host: HTMLElement
  root: Root
  sync: () => void
}

const controls = new Map<Element, MountedControl>()
const nativeInputValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")
const nativeInputChecked = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")

function fieldLabel(element: HTMLElement) {
  return element.getAttribute("aria-label")
    || element.closest("label")?.querySelector(":scope > span")?.textContent?.trim()
    || element.getAttribute("placeholder")
    || "Form control"
}

function hideSource(element: HTMLElement) {
  element.classList.add("create-shadcn-control-source")
  element.hidden = true
  element.tabIndex = -1
  element.setAttribute("aria-hidden", "true")
}

function mountInput(input: HTMLInputElement) {
  if (controls.has(input) || !nativeInputValue?.set || input.closest('[data-slot="input"]')) return
  if (["checkbox", "file", "hidden", "radio"].includes(input.type)) return

  const host = document.createElement("div")
  host.className = "create-real-input-host"
  input.after(host)
  hideSource(input)
  const root = createRoot(host)

  const sync = () => {
    root.render(
      <Input
        type={input.type || "text"}
        value={input.value}
        placeholder={input.placeholder}
        aria-label={fieldLabel(input)}
        autoComplete={input.autocomplete || undefined}
        min={input.min || undefined}
        max={input.max || undefined}
        step={input.step || undefined}
        disabled={input.disabled}
        readOnly={input.readOnly}
        className="create-real-input"
        onChange={(event) => {
          nativeInputValue.set?.call(input, event.target.value)
          input.dispatchEvent(new Event("input", { bubbles: true }))
        }}
      />,
    )
  }

  input.addEventListener("input", sync)
  input.addEventListener("change", sync)
  input.form?.addEventListener("reset", () => queueMicrotask(sync))
  controls.set(input, { host, root, sync })
  sync()
}

function mountCheckbox(input: HTMLInputElement) {
  if (controls.has(input) || !nativeInputChecked?.set || input.closest('[data-slot="checkbox"]')) return
  const host = document.createElement("span")
  host.className = "create-real-checkbox-host"
  input.after(host)
  hideSource(input)
  const root = createRoot(host)

  const sync = () => {
    root.render(
      <Checkbox
        checked={input.checked}
        disabled={input.disabled}
        aria-label={fieldLabel(input)}
        onCheckedChange={(checked) => {
          nativeInputChecked.set?.call(input, checked === true)
          input.dispatchEvent(new Event("input", { bubbles: true }))
          input.dispatchEvent(new Event("change", { bubbles: true }))
        }}
      />,
    )
  }

  input.addEventListener("input", sync)
  input.addEventListener("change", sync)
  input.form?.addEventListener("reset", () => queueMicrotask(sync))
  controls.set(input, { host, root, sync })
  sync()
}

function buttonPresentation(button: HTMLButtonElement) {
  if (button.hasAttribute("data-create-reset")) {
    return { variant: "ghost" as const, size: "sm" as const, icon: <RotateCcwIcon aria-hidden="true" /> }
  }
  if (button.hasAttribute("data-add-row")) {
    return { variant: "outline" as const, size: "sm" as const, icon: <PlusIcon aria-hidden="true" /> }
  }
  if (button.hasAttribute("data-remove-row")) {
    return { variant: "ghost" as const, size: "icon-sm" as const, icon: <Trash2Icon aria-hidden="true" /> }
  }
  return { variant: "default" as const, size: "default" as const, icon: null }
}

function mountButton(button: HTMLButtonElement) {
  if (controls.has(button) || button.closest(".create-mode-switch") || button.closest('[data-slot="button"]')) return
  const host = document.createElement("span")
  host.className = "create-real-button-host"
  button.before(host)
  hideSource(button)
  const root = createRoot(host)

  const sync = () => {
    const presentation = buttonPresentation(button)
    const text = button.textContent?.trim().replace(/^\+\s*/, "") || ""
    root.render(
      <Button
        type="button"
        variant={presentation.variant}
        size={presentation.size}
        disabled={button.disabled}
        aria-label={button.getAttribute("aria-label") || undefined}
        className={button.hasAttribute("data-create-submit") ? "create-real-submit" : undefined}
        onClick={() => button.click()}
      >
        {presentation.icon}
        {button.hasAttribute("data-remove-row") ? null : text}
      </Button>,
    )
  }

  controls.set(button, { host, root, sync })
  sync()
}

function mountModeTabs(source: HTMLElement) {
  if (controls.has(source)) return
  const host = document.createElement("div")
  host.className = "create-real-tabs-host"
  source.before(host)
  hideSource(source)
  const root = createRoot(host)

  const sync = () => {
    const workspace = source.closest<HTMLElement>("[data-create-workspace]")
    const value = workspace?.dataset.mode || "form"
    root.render(
      <Tabs
        value={value}
        onValueChange={(mode) => source.querySelector<HTMLButtonElement>(`[data-create-mode="${mode}"]`)?.click()}
      >
        <TabsList aria-label="Resource editor mode">
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="yaml">YAML</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
  }

  controls.set(source, { host, root, sync })
  sync()
}

function scan(root: ParentNode) {
  const workspace = root instanceof HTMLElement && root.matches("[data-create-workspace]")
    ? root
    : root.querySelector<HTMLElement>("[data-create-workspace]")
  if (!workspace) return

  workspace.querySelectorAll<HTMLInputElement>('form[data-create-form] input').forEach((input) => {
    if (input.type === "checkbox") mountCheckbox(input)
    else mountInput(input)
  })
  workspace.querySelectorAll<HTMLButtonElement>("[data-create-reset], [data-create-submit], [data-add-row], [data-remove-row]").forEach(mountButton)
  const modeTabs = workspace.querySelector<HTMLElement>(".create-mode-switch")
  if (modeTabs) mountModeTabs(modeTabs)
}

window.syncCreateShadcnControls = (root = document) => {
  scan(root)
  controls.forEach(({ sync }, source) => {
    if (document.contains(source)) sync()
  })
}

scan(document)

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
    if (node instanceof HTMLElement) scan(node)
  }))
  controls.forEach(({ host, root }, source) => {
    if (document.contains(source)) return
    root.unmount()
    host.remove()
    controls.delete(source)
  })
})

observer.observe(document.body, { childList: true, subtree: true })

window.dispatchEvent(new CustomEvent("create-shadcn-controls-ready"))
