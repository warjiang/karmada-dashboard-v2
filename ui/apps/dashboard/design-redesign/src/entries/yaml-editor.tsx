import { createRoot, type Root } from "react-dom/client"

import { YamlCodeEditor } from "@/components/yaml-code-editor"

const yamlSelector = [
  "textarea.yaml-editor",
  "textarea[data-create-yaml]",
  "textarea[data-dashboard-config-yaml]",
  "textarea.detail-values",
].join(",")

const nativeValue = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype,
  "value"
)

interface MountedYamlEditor {
  container: HTMLDivElement
  root: Root
  render: (value: string) => void
}

const mountedEditors = new Map<HTMLTextAreaElement, MountedYamlEditor>()

function editorLabel(element: HTMLTextAreaElement) {
  if (element.matches("[data-dashboard-config-yaml]")) return "Dashboard ConfigMap YAML"
  if (element.matches("[data-create-yaml]")) return "Resource YAML"
  if (element.matches(".detail-values")) return "Helm values"
  return element.getAttribute("aria-label") || "Resource YAML"
}

function editorHeight(element: HTMLTextAreaElement) {
  if (element.matches("[data-dashboard-config-yaml]")) return 520
  if (element.matches("[data-create-yaml]")) return 510
  if (element.matches(".detail-values")) return 300
  if (element.closest(".control-editor-modal")) return 360
  return 430
}

function setNativeValue(element: HTMLTextAreaElement, value: string) {
  nativeValue?.set?.call(element, value)
}

function mountYamlEditor(element: HTMLTextAreaElement) {
  if (mountedEditors.has(element) || !nativeValue?.get || !nativeValue.set) return

  const container = document.createElement("div")
  container.className = "yaml-code-editor-mount"
  element.before(container)
  element.classList.add("yaml-editor-source")
  element.setAttribute("aria-hidden", "true")
  element.dataset.yamlEnhanced = "true"
  element.hidden = true
  element.tabIndex = -1

  const root = createRoot(container)
  const label = editorLabel(element)
  const height = editorHeight(element)
  const readOnly = element.readOnly || element.disabled

  const render = (value: string) => {
    root.render(
      <YamlCodeEditor
        value={value}
        label={label}
        height={height}
        readOnly={readOnly}
        onChange={(nextValue) => {
          setNativeValue(element, nextValue)
          element.dispatchEvent(new Event("input", { bubbles: true }))
        }}
      />
    )
  }

  mountedEditors.set(element, { container, root, render })

  Object.defineProperty(element, "value", {
    configurable: true,
    get() {
      return nativeValue.get?.call(element)
    },
    set(nextValue: string) {
      const normalizedValue = String(nextValue)
      setNativeValue(element, normalizedValue)
      render(normalizedValue)
    },
  })

  render(element.value)
}

function scanForYamlEditors(node: ParentNode) {
  if (node instanceof HTMLTextAreaElement && node.matches(yamlSelector)) {
    mountYamlEditor(node)
  }
  node.querySelectorAll<HTMLTextAreaElement>(yamlSelector).forEach(mountYamlEditor)
}

scanForYamlEditors(document)

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement) scanForYamlEditors(node)
    })
  })

  mountedEditors.forEach(({ root }, element) => {
    if (document.contains(element)) return
    root.unmount()
    mountedEditors.delete(element)
  })
})

observer.observe(document.body, { childList: true, subtree: true })
