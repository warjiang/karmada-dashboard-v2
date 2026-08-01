import { createRoot, type Root } from "react-dom/client"

import { ClusterManagementWorkspace } from "@/components/cluster-management-workspace"

const roots = new WeakMap<HTMLElement, Root>()

window.mountShadcnClusterManagement = (element, options) => {
  let root = roots.get(element)
  if (!root) {
    root = createRoot(element)
    roots.set(element, root)
  }
  root.render(<ClusterManagementWorkspace {...options} />)
}

window.dispatchEvent(new CustomEvent("cluster-management-workspace-ready"))
