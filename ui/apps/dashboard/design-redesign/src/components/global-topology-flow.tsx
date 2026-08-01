import dagre from "@dagrejs/dagre"
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  ControlButton,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react"

import "@xyflow/react/dist/style.css"

export interface TopologyCluster {
  name: string
  mode: string
  status: string
  version: string
}

export interface TopologyTrace {
  kind: string
  namespace: string
  resource: string
}

export interface GlobalTopologyApi {
  clearSelection: () => void
  fitView: () => void
  setDirection: (direction: TopologyDirection, announce?: boolean) => void
  updateTrace: (trace: TopologyTrace) => void
}

export interface GlobalTopologyFlowProps {
  clusters: TopologyCluster[]
  initialTrace: TopologyTrace
  onLayoutChange?: (direction: TopologyDirection) => void
}

type TopologyDirection = "tb" | "lr"
type NodeKind = "template" | "binding" | "work" | "cluster" | "resource" | "pod"

interface TopologyNodeData extends Record<string, unknown> {
  detail: string
  kind: NodeKind
  label: string
  link: string
  stage: string
  status: string
  tags: string[]
  warning?: boolean
}

interface TopologyEdgeData extends Record<string, unknown> {
  label?: string
  labelHref?: string
  labelType?: "pp" | "op" | "telemetry"
  warning?: boolean
}

type TopologyNode = Node<TopologyNodeData, "topologyNode">
type TopologyEdge = Edge<TopologyEdgeData, "topologyEdge">

const nodeDimensions: Record<NodeKind, { width: number; height: number }> = {
  template: { width: 276, height: 98 },
  binding: { width: 276, height: 98 },
  work: { width: 230, height: 98 },
  cluster: { width: 230, height: 98 },
  resource: { width: 230, height: 98 },
  pod: { width: 150, height: 84 },
}

const kindClass: Record<NodeKind, string> = {
  template: "global-template-node",
  binding: "global-binding-node",
  work: "global-work-node",
  cluster: "global-cluster-node",
  resource: "global-member-resource",
  pod: "global-pod-node",
}

function createNodes(clusters: TopologyCluster[], trace: TopologyTrace): TopologyNode[] {
  const nodes: TopologyNode[] = [
    {
      id: "template",
      type: "topologyNode",
      position: { x: 0, y: 0 },
      data: {
        kind: "template",
        stage: "ResourceTemplate",
        label: trace.resource,
        tags: [trace.kind, trace.namespace],
        status: "Current",
        detail: "The source workload template before policy matching, scheduling, and override resolution.",
        link: `resources.html?resource=${trace.kind.toLowerCase()}s`,
      },
    },
    {
      id: "binding",
      type: "topologyNode",
      position: { x: 0, y: 0 },
      data: {
        kind: "binding",
        stage: "ResourceBinding",
        label: `${trace.resource}-${trace.kind.toLowerCase()}`,
        tags: [trace.namespace, `${clusters.length} clusters`],
        status: "Scheduled",
        detail: "The binding records the resolved placement decision produced from the matched propagation policy.",
        link: "resources.html?resource=resource-bindings",
      },
    },
  ]

  clusters.forEach((cluster) => {
    const warning = cluster.status === "Stale"
    nodes.push(
      {
        id: `work-${cluster.name}`,
        type: "topologyNode",
        position: { x: 0, y: 0 },
        data: {
          kind: "work",
          stage: "Work",
          label: `${trace.resource}-${cluster.name}`,
          tags: [warning ? "Telemetry stale" : "Applied"],
          status: warning ? "Telemetry stale" : "Applied",
          detail: `A Work object carries the rendered manifest and apply status for ${cluster.name}.`,
          link: "resources.html?resource=works",
          warning,
        },
      },
      {
        id: `cluster-${cluster.name}`,
        type: "topologyNode",
        position: { x: 0, y: 0 },
        data: {
          kind: "cluster",
          stage: "Member cluster",
          label: cluster.name,
          tags: [cluster.mode, cluster.version],
          status: warning ? "Connected · telemetry stale" : "Connected",
          detail: `${cluster.name} receives the rendered Work through ${cluster.mode} mode and reports realized Kubernetes state.`,
          link: `member-cluster.html?cluster=${cluster.name}#overview`,
          warning,
        },
      },
      {
        id: `resource-${cluster.name}`,
        type: "topologyNode",
        position: { x: 0, y: 0 },
        data: {
          kind: "resource",
          stage: "Realized resource",
          label: trace.resource,
          tags: [trace.kind, "Ready 2 / 2"],
          status: "Ready 2 / 2",
          detail: `The concrete Kubernetes workload realized from the Work object inside ${cluster.name}.`,
          link: `member-cluster.html?cluster=${cluster.name}#${trace.kind.toLowerCase()}s`,
          warning,
        },
      },
      ...[1, 2].map<TopologyNode>((ordinal) => ({
        id: `pod-${cluster.name}-${ordinal}`,
        type: "topologyNode",
        position: { x: 0, y: 0 },
        data: {
          kind: "pod",
          stage: "Pod",
          label: `${trace.resource}-${cluster.name}-${ordinal}`,
          tags: ["Running", "0 restarts"],
          status: "Running",
          detail: `A running Pod owned by the realized workload in ${cluster.name}.`,
          link: `member-cluster.html?cluster=${cluster.name}#pods`,
          warning,
        },
      })),
    )
  })

  return nodes
}

function createEdges(clusters: TopologyCluster[]): TopologyEdge[] {
  const edges: TopologyEdge[] = [
    {
      id: "template-binding",
      source: "template",
      target: "binding",
      type: "topologyEdge",
      data: {
        label: "demo-policy",
        labelHref: "resources.html?resource=propagation-policies",
        labelType: "pp",
      },
    },
  ]

  // Dagre orders parallel branches opposite their insertion order; reversing here
  // preserves the operator-facing member1 → member2 → member3 sequence.
  clusters.slice().reverse().forEach((cluster, index) => {
    const warning = cluster.status === "Stale"
    edges.push(
      {
        id: `binding-work-${cluster.name}`,
        source: "binding",
        target: `work-${cluster.name}`,
        type: "topologyEdge",
        data: index === 1 ? {
          label: "regional-overrides",
          labelHref: "resources.html?resource=override-policies",
          labelType: "op",
        } : undefined,
      },
      {
        id: `work-cluster-${cluster.name}`,
        source: `work-${cluster.name}`,
        target: `cluster-${cluster.name}`,
        type: "topologyEdge",
        data: warning ? { label: "PULL · TELEMETRY 2m", labelType: "telemetry", warning: true } : undefined,
      },
      {
        id: `cluster-resource-${cluster.name}`,
        source: `cluster-${cluster.name}`,
        target: `resource-${cluster.name}`,
        type: "topologyEdge",
        data: warning ? { warning: true } : undefined,
      },
      ...[1, 2].map<TopologyEdge>((ordinal) => ({
        id: `resource-pod-${cluster.name}-${ordinal}`,
        source: `resource-${cluster.name}`,
        target: `pod-${cluster.name}-${ordinal}`,
        type: "topologyEdge",
        data: warning ? { warning: true } : undefined,
      })),
    )
  })

  return edges
}

function applyDagreLayout(nodes: TopologyNode[], edges: TopologyEdge[], direction: TopologyDirection) {
  const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: direction === "tb" ? "TB" : "LR",
    ranksep: direction === "tb" ? 58 : 86,
    nodesep: direction === "tb" ? 44 : 38,
    edgesep: 18,
    marginx: 34,
    marginy: 34,
  })

  nodes.forEach((node) => {
    const size = nodeDimensions[node.data.kind]
    graph.setNode(node.id, { ...size })
  })
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target))
  dagre.layout(graph)

  return nodes.map((node) => {
    const position = graph.node(node.id)
    const size = nodeDimensions[node.data.kind]
    return {
      ...node,
      sourcePosition: direction === "tb" ? Position.Bottom : Position.Right,
      targetPosition: direction === "tb" ? Position.Top : Position.Left,
      position: { x: position.x - size.width / 2, y: position.y - size.height / 2 },
      style: size,
    }
  })
}

function TopologyNodeCard({ data, selected, sourcePosition, targetPosition }: NodeProps<TopologyNode>) {
  return (
    <>
      <Handle className="global-flow-handle" type="target" position={targetPosition || Position.Top} />
      <button
        className={`xyflow-node-card ${kindClass[data.kind]} ${data.warning ? "is-warning" : ""} ${selected ? "selected" : ""}`}
        type="button"
        aria-label={`${data.stage} ${data.label}`}
      >
        <span className="global-node-head">
          <span className="global-node-kind">{data.kind === "resource" ? "Member resource" : data.stage}</span>
          <i className="global-node-health" />
        </span>
        <span className="global-node-body">
          <strong>{data.label}</strong>
          <span className="global-node-tags">
            {data.tags.map((tag) => <b key={tag}>{tag}</b>)}
          </span>
        </span>
      </button>
      <Handle className="global-flow-handle" type="source" position={sourcePosition || Position.Bottom} />
    </>
  )
}

function TopologyEdgeLine({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data }: EdgeProps<TopologyEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
    offset: 18,
  })
  const warning = Boolean(data?.warning)

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={warning ? "global-react-flow-edge warning" : "global-react-flow-edge"}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          {data.labelType === "telemetry" ? (
            <span
              className="global-edge-telemetry nodrag nopan"
              style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            >
              {data.label}
            </span>
          ) : (
            <a
              className={`global-edge-label xyflow-edge-label ${data.labelType === "op" ? "global-edge-op" : "global-edge-pp"} nodrag nopan`}
              href={data.labelHref}
              style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
              onClick={(event) => event.stopPropagation()}
            >
              <b>{data.labelType?.toUpperCase()}</b><span>{data.label}</span>
            </a>
          )}
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const nodeTypes = { topologyNode: TopologyNodeCard }
const edgeTypes = { topologyEdge: TopologyEdgeLine }

const GlobalTopologyInner = forwardRef<GlobalTopologyApi, GlobalTopologyFlowProps>(function GlobalTopologyInner(
  { clusters, initialTrace, onLayoutChange },
  ref,
) {
  const initialEdges = useMemo(() => createEdges(clusters), [clusters])
  const [direction, setDirectionState] = useState<TopologyDirection>("tb")
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [nodes, setNodes, onNodesChange] = useNodesState<TopologyNode>(
    applyDagreLayout(createNodes(clusters, initialTrace), initialEdges, "tb"),
  )
  const [edges, , onEdgesChange] = useEdgesState<TopologyEdge>(initialEdges)
  const flow = useReactFlow<TopologyNode, TopologyEdge>()

  const fit = useCallback(() => {
    requestAnimationFrame(() => void flow.fitView({ duration: 380, padding: 0.08, maxZoom: 1.12 }))
  }, [flow])

  const setDirection = useCallback((nextDirection: TopologyDirection) => {
    setDirectionState(nextDirection)
    setNodes((currentNodes) => applyDagreLayout(currentNodes, edges, nextDirection))
    onLayoutChange?.(nextDirection)
    fit()
  }, [edges, fit, onLayoutChange, setNodes])

  const updateTrace = useCallback((trace: TopologyTrace) => {
    setNodes((currentNodes) => currentNodes.map((node) => {
      const clusterName = node.id.split("-")[1]
      const ordinal = node.id.split("-").at(-1)
      let label = node.data.label
      let tags = node.data.tags
      let link = node.data.link
      if (node.id === "template") {
        label = trace.resource
        tags = [trace.kind, trace.namespace]
        link = `resources.html?resource=${trace.kind.toLowerCase()}s`
      } else if (node.id === "binding") {
        label = `${trace.resource}-${trace.kind.toLowerCase()}`
        tags = [trace.namespace, `${clusters.length} clusters`]
      } else if (node.id.startsWith("work-")) {
        label = `${trace.resource}-${clusterName}`
      } else if (node.id.startsWith("resource-")) {
        label = trace.resource
        tags = [trace.kind, "Ready 2 / 2"]
        link = `member-cluster.html?cluster=${clusterName}#${trace.kind.toLowerCase()}s`
      } else if (node.id.startsWith("pod-")) {
        label = `${trace.resource}-${clusterName}-${ordinal}`
      }
      return { ...node, data: { ...node.data, label, tags, link } }
    }))
  }, [clusters.length, setNodes])

  useImperativeHandle(ref, () => ({
    clearSelection: () => setNodes((currentNodes) => currentNodes.map((node) => ({ ...node, selected: false }))),
    fitView: fit,
    setDirection,
    updateTrace,
  }), [fit, setDirection, setNodes, updateTrace])

  const selectNode = useCallback((_event: React.MouseEvent, node: TopologyNode) => {
    window.dispatchEvent(new CustomEvent("global-topology-node-selected", { detail: node.data }))
  }, [])

  return (
    <ReactFlow<TopologyNode, TopologyEdge>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={selectNode}
      onNodeDoubleClick={(_event, node) => { window.location.href = node.data.link }}
      fitView
      fitViewOptions={{ padding: 0.08, maxZoom: 1.12 }}
      minZoom={0.28}
      maxZoom={1.65}
      nodesConnectable={false}
      deleteKeyCode={null}
      selectionOnDrag
      panOnScroll
      zoomOnDoubleClick={false}
      proOptions={{ hideAttribution: true }}
      aria-label="Global resource delivery topology"
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="global-react-flow-background" />
      {showMiniMap && (
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          nodeStrokeWidth={2}
          nodeColor={(node) => node.data?.warning ? "#b7791f" : "#087ff5"}
          nodeBorderRadius={6}
          aria-label="Topology minimap"
        />
      )}
      <Controls
        position="top-right"
        orientation="horizontal"
        showInteractive={false}
        fitViewOptions={{ duration: 380, padding: 0.08, maxZoom: 1.12 }}
        className="global-flow-tools"
        aria-label="Topology viewport and layout controls"
      >
        <ControlButton className={showMiniMap ? "global-minimap-control active" : "global-minimap-control"} onClick={() => setShowMiniMap((visible) => !visible)} aria-label={showMiniMap ? "Hide minimap" : "Show minimap"} aria-pressed={showMiniMap} title={showMiniMap ? "Hide minimap" : "Show minimap"}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3Z" /><path d="M8 3v15M16 6v15" /></svg>
        </ControlButton>
        <ControlButton className={direction === "tb" ? "global-direction-control active" : "global-direction-control"} onClick={() => setDirection("tb")} aria-label="Top to bottom layout" aria-pressed={direction === "tb"} title="Top to bottom layout"><span>TB</span></ControlButton>
        <ControlButton className={direction === "lr" ? "global-direction-control active" : "global-direction-control"} onClick={() => setDirection("lr")} aria-label="Left to right layout" aria-pressed={direction === "lr"} title="Left to right layout"><span>LR</span></ControlButton>
        <ControlButton className="global-auto-layout" onClick={() => setDirection(direction)} aria-label="Run Dagre automatic layout" title="Run automatic layout">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="6" height="5" rx="1" /><rect x="15" y="4" width="6" height="5" rx="1" /><rect x="9" y="15" width="6" height="5" rx="1" /><path d="M6 9v3h12V9M12 12v3" /></svg>
          <span>Auto layout</span><small>Dagre</small>
        </ControlButton>
      </Controls>
    </ReactFlow>
  )
})

export const GlobalTopologyFlow = forwardRef<GlobalTopologyApi, GlobalTopologyFlowProps>(function GlobalTopologyFlow(props, ref) {
  return <ReactFlowProvider><GlobalTopologyInner ref={ref} {...props} /></ReactFlowProvider>
})
