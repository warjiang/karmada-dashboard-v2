import { createRoot, type Root } from "react-dom/client"
import { createRef } from "react"

import {
  GlobalTopologyFlow,
  type GlobalTopologyApi,
  type GlobalTopologyFlowProps,
} from "@/components/global-topology-flow"

const mountedRoots = new WeakMap<HTMLElement, Root>()

window.mountGlobalTopologyFlow = (element, options) => {
  let root = mountedRoots.get(element)
  if (!root) {
    root = createRoot(element)
    mountedRoots.set(element, root)
  }

  const apiRef = createRef<GlobalTopologyApi>()
  root.render(<GlobalTopologyFlow ref={apiRef} {...options} />)

  return {
    clearSelection: () => apiRef.current?.clearSelection(),
    fitView: () => apiRef.current?.fitView(),
    setDirection: (direction, announce) => apiRef.current?.setDirection(direction, announce),
    updateTrace: (trace) => apiRef.current?.updateTrace(trace),
  }
}

window.dispatchEvent(new CustomEvent("global-topology-flow-ready"))

export type { GlobalTopologyApi, GlobalTopologyFlowProps }
