import { createRef } from "react"
import { createRoot, type Root } from "react-dom/client"

import { MetricsDashboard, type MetricsDashboardApi, type MetricsDashboardState } from "@/components/metrics-dashboard"

const mountedRoots = new WeakMap<HTMLElement, Root>()

window.mountMetricsDashboard = (element, initialState) => {
  let root = mountedRoots.get(element)
  if (!root) {
    root = createRoot(element)
    mountedRoots.set(element, root)
  }
  const apiRef = createRef<MetricsDashboardApi>()
  root.render(<MetricsDashboard initialState={initialState} apiRef={apiRef} />)
  return { update: (next: Partial<MetricsDashboardState>) => apiRef.current?.update(next) }
}

window.dispatchEvent(new CustomEvent("metrics-dashboard-ready"))
