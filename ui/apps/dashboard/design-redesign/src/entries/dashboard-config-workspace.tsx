import { createRoot, type Root } from "react-dom/client"

import dashboardConfig from "@/data/dashboard-config.json"
import { DashboardConfigWorkspace, type DashboardConfig } from "@/components/dashboard-config-workspace"

const roots = new WeakMap<HTMLElement, Root>()

document.querySelectorAll<HTMLElement>("[data-shadcn-dashboard-config-root]").forEach((element) => {
  let root = roots.get(element)
  if (!root) {
    root = createRoot(element)
    roots.set(element, root)
  }
  root.render(<DashboardConfigWorkspace config={dashboardConfig as DashboardConfig} />)
})
