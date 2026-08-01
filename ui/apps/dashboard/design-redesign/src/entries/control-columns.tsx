import { createRoot, type Root } from "react-dom/client"

import {
  ControlColumns,
  type ControlColumn,
} from "@/components/control-columns"

interface MountOptions {
  columns: ControlColumn[]
  title: string
  viewId: string
}

const mountedRoots = new WeakMap<HTMLElement, Root>()

window.mountShadcnControlColumns = (
  element: HTMLElement,
  options: MountOptions
) => {
  let root = mountedRoots.get(element)
  if (!root) {
    root = createRoot(element)
    mountedRoots.set(element, root)
  }

  root.render(<ControlColumns key={options.viewId} {...options} />)
}

window.dispatchEvent(new CustomEvent("shadcn-columns-ready"))
