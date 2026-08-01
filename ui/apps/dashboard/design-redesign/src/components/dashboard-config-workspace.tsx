import * as React from "react"
import {
  BarChart3Icon,
  BracesIcon,
  ChevronRightIcon,
  FolderTreeIcon,
  GripVerticalIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export interface DashboardMenuNode {
  children: DashboardMenuNode[]
  enable: boolean
  path: string
  sidebar_key: string
}

export interface MetricPanel {
  chart_type: string
  id: string
  metric_name: string
  order: number
  title: string
  visible: boolean
  [key: string]: unknown
}

export interface MetricsDashboardConfig {
  component: string
  panels: MetricPanel[]
  version: number
}

export interface DashboardConfig {
  chart_registries: unknown[]
  docker_registries: unknown[]
  menu_configs: DashboardMenuNode[]
  metrics_dashboards: MetricsDashboardConfig[]
  path_prefix: string
}

interface DragState {
  fromIndex: number
  parentKey: string
}

interface DropState {
  after: boolean
  index: number
  parentKey: string
}

function cloneMenus(menus: DashboardMenuNode[]) {
  return structuredClone(menus)
}

function updateListAtPath(
  menus: DashboardMenuNode[],
  parentPath: number[],
  update: (items: DashboardMenuNode[]) => DashboardMenuNode[],
): DashboardMenuNode[] {
  if (!parentPath.length) return update(menus)
  const [index, ...rest] = parentPath
  return menus.map((node, nodeIndex) => nodeIndex === index ? {
    ...node,
    children: updateListAtPath(node.children, rest, update),
  } : node)
}

function reorderItems(items: DashboardMenuNode[], fromIndex: number, targetIndex: number, after: boolean) {
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  let insertionIndex = targetIndex + (after ? 1 : 0)
  if (fromIndex < insertionIndex) insertionIndex -= 1
  next.splice(insertionIndex, 0, moved)
  return next
}

interface MenuTreeListProps {
  depth?: number
  dragState: DragState | null
  dropState: DropState | null
  expanded: Set<string>
  nodes: DashboardMenuNode[]
  onDragEnd: () => void
  onDragStart: (state: DragState) => void
  onDrop: (parentPath: number[], targetIndex: number, after: boolean) => void
  onDropStateChange: (state: DropState | null) => void
  onExpandedChange: (key: string, open: boolean) => void
  onMoveByKeyboard: (parentPath: number[], index: number, direction: -1 | 1) => void
  onToggle: (parentPath: number[], index: number, enabled: boolean) => void
  parentKey?: string
  parentPath?: number[]
}

function MenuTreeList({
  depth = 0,
  dragState,
  dropState,
  expanded,
  nodes,
  onDragEnd,
  onDragStart,
  onDrop,
  onDropStateChange,
  onExpandedChange,
  onMoveByKeyboard,
  onToggle,
  parentKey = "root",
  parentPath = [],
}: MenuTreeListProps) {
  return (
    <div className={cn("dashboard-real-tree-list", depth > 0 && "dashboard-real-tree-children")} role={depth === 0 ? "tree" : "group"} aria-label={depth === 0 ? "Dashboard menu configuration" : undefined}>
      {nodes.map((node, index) => {
        const nodeKey = `${parentKey}/${node.sidebar_key}`
        const hasChildren = node.children.length > 0
        const open = expanded.has(nodeKey)
        const isDragging = dragState?.parentKey === parentKey && dragState.fromIndex === index
        const isDropTarget = dropState?.parentKey === parentKey && dropState.index === index
        return (
          <Collapsible
            key={nodeKey}
            className={cn("dashboard-real-tree-node", isDragging && "is-dragging", isDropTarget && (dropState.after ? "drop-after" : "drop-before"))}
            open={open}
            onOpenChange={(nextOpen) => hasChildren && onExpandedChange(nodeKey, nextOpen)}
          >
            <div
              className="dashboard-real-tree-row"
              role="treeitem"
              aria-level={depth + 1}
              aria-expanded={hasChildren ? open : undefined}
              onDragOver={(event) => {
                if (!dragState || dragState.parentKey !== parentKey || dragState.fromIndex === index) return
                event.preventDefault()
                const rect = event.currentTarget.getBoundingClientRect()
                onDropStateChange({ parentKey, index, after: event.clientY > rect.top + rect.height / 2 })
                event.dataTransfer.dropEffect = "move"
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onDropStateChange(null)
              }}
              onDrop={(event) => {
                if (!dragState || dragState.parentKey !== parentKey || dragState.fromIndex === index) return
                event.preventDefault()
                onDrop(parentPath, index, dropState?.after ?? false)
              }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="dashboard-real-tree-grip"
                draggable
                aria-label={`Reorder ${node.path}`}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData("text/plain", nodeKey)
                  onDragStart({ parentKey, fromIndex: index })
                }}
                onDragEnd={onDragEnd}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
                  event.preventDefault()
                  onMoveByKeyboard(parentPath, index, event.key === "ArrowUp" ? -1 : 1)
                }}
              >
                <GripVerticalIcon aria-hidden="true" />
              </Button>
              {hasChildren ? (
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-xs" className="dashboard-real-tree-toggle" aria-label={`${open ? "Collapse" : "Expand"} ${node.path}`}>
                    <ChevronRightIcon aria-hidden="true" />
                  </Button>
                </CollapsibleTrigger>
              ) : <span className="dashboard-real-tree-toggle-placeholder" aria-hidden="true" />}
              <button type="button" className="dashboard-real-tree-label" onClick={() => hasChildren && onExpandedChange(nodeKey, !open)}>
                <code>{node.path}</code>
                <small>{node.sidebar_key}</small>
              </button>
              <Switch checked={node.enable} onCheckedChange={(checked) => onToggle(parentPath, index, checked)} aria-label={`Enable ${node.path}`} />
            </div>
            {hasChildren ? (
              <CollapsibleContent>
                <MenuTreeList
                  depth={depth + 1}
                  dragState={dragState}
                  dropState={dropState}
                  expanded={expanded}
                  nodes={node.children}
                  onDragEnd={onDragEnd}
                  onDragStart={onDragStart}
                  onDrop={onDrop}
                  onDropStateChange={onDropStateChange}
                  onExpandedChange={onExpandedChange}
                  onMoveByKeyboard={onMoveByKeyboard}
                  onToggle={onToggle}
                  parentKey={nodeKey}
                  parentPath={[...parentPath, index]}
                />
              </CollapsibleContent>
            ) : null}
          </Collapsible>
        )
      })}
    </div>
  )
}

export function DashboardConfigWorkspace({ config }: { config: DashboardConfig }) {
  const initialMenus = React.useMemo(() => cloneMenus(config.menu_configs), [config.menu_configs])
  const [menus, setMenus] = React.useState(initialMenus)
  const [expanded, setExpanded] = React.useState(() => new Set(["root/MULTICLOUD-RESOURCE-MANAGE"]))
  const [dragState, setDragState] = React.useState<DragState | null>(null)
  const [dropState, setDropState] = React.useState<DropState | null>(null)
  const [dashboardIndex, setDashboardIndex] = React.useState(0)
  const [panelIndex, setPanelIndex] = React.useState(0)
  const menusRef = React.useRef(menus)
  const baselineRef = React.useRef(cloneMenus(initialMenus))
  const hiddenStateRef = React.useRef<HTMLInputElement | null>(null)

  const selectedDashboard = config.metrics_dashboards[dashboardIndex]
  const selectedPanel = selectedDashboard?.panels[panelIndex]

  React.useEffect(() => {
    menusRef.current = menus
  }, [menus])

  React.useEffect(() => {
    hiddenStateRef.current = document.querySelector("[data-dashboard-config-state]")
    const settingsRoot = document.querySelector("[data-settings-root]")
    const onSave = () => { baselineRef.current = cloneMenus(menusRef.current) }
    const onDiscard = () => setMenus(cloneMenus(baselineRef.current))
    settingsRoot?.addEventListener("settings:save", onSave)
    settingsRoot?.addEventListener("settings:discard", onDiscard)
    return () => {
      settingsRoot?.removeEventListener("settings:save", onSave)
      settingsRoot?.removeEventListener("settings:discard", onDiscard)
    }
  }, [])

  function commitMenus(nextMenus: DashboardMenuNode[]) {
    menusRef.current = nextMenus
    setMenus(nextMenus)
    if (hiddenStateRef.current) {
      hiddenStateRef.current.value = JSON.stringify(nextMenus)
      hiddenStateRef.current.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }

  function toggleMenu(parentPath: number[], index: number, enabled: boolean) {
    commitMenus(updateListAtPath(menusRef.current, parentPath, (items) => items.map((node, nodeIndex) => nodeIndex === index ? { ...node, enable: enabled } : node)))
  }

  function moveMenu(parentPath: number[], index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    commitMenus(updateListAtPath(menusRef.current, parentPath, (items) => {
      if (targetIndex < 0 || targetIndex >= items.length) return items
      return reorderItems(items, index, targetIndex, direction > 0)
    }))
  }

  function dropMenu(parentPath: number[], targetIndex: number, after: boolean) {
    if (!dragState) return
    commitMenus(updateListAtPath(menusRef.current, parentPath, (items) => reorderItems(items, dragState.fromIndex, targetIndex, after)))
    setDragState(null)
    setDropState(null)
  }

  return (
    <div className="dashboard-config-workspace-grid">
      <Card className="dashboard-config-workspace-card">
        <CardHeader className="dashboard-config-workspace-header">
          <div className="dashboard-config-workspace-heading">
            <FolderTreeIcon aria-hidden="true" />
            <div><CardTitle>Menu configuration</CardTitle><CardDescription>Expand, enable, and reorder menu items within the same level.</CardDescription></div>
          </div>
          <Badge variant="outline">{`${menus.length} roots`}</Badge>
        </CardHeader>
        <CardContent className="dashboard-config-workspace-content">
          <div className="dashboard-real-tree-columns"><span>Path / Sidebar key</span><span>Enabled</span></div>
          <ScrollArea className="dashboard-real-tree-scroll">
            <MenuTreeList
              dragState={dragState}
              dropState={dropState}
              expanded={expanded}
              nodes={menus}
              onDragEnd={() => { setDragState(null); setDropState(null) }}
              onDragStart={setDragState}
              onDrop={dropMenu}
              onDropStateChange={setDropState}
              onExpandedChange={(key, open) => setExpanded((current) => {
                const next = new Set(current)
                if (open) next.add(key)
                else next.delete(key)
                return next
              })}
              onMoveByKeyboard={moveMenu}
              onToggle={toggleMenu}
            />
          </ScrollArea>
          <p className="dashboard-config-workspace-help">Drag the handle or focus it and use Arrow Up / Arrow Down. Cross-parent moves are disabled.</p>
        </CardContent>
      </Card>

      <Card className="dashboard-config-workspace-card">
        <CardHeader className="dashboard-config-workspace-header">
          <div className="dashboard-config-workspace-heading">
            <BarChart3Icon aria-hidden="true" />
            <div><CardTitle>Metrics dashboards</CardTitle><CardDescription>Version and component are read only. Select a panel to inspect its metric JSON.</CardDescription></div>
          </div>
          <Badge variant="outline">{`${config.metrics_dashboards.reduce((total, dashboard) => total + dashboard.panels.length, 0)} panels`}</Badge>
        </CardHeader>
        <CardContent className="dashboard-config-workspace-content dashboard-metrics-browser">
          <div className="dashboard-metrics-master-detail">
            <ScrollArea className="dashboard-metrics-dashboard-list">
              {config.metrics_dashboards.map((dashboard, index) => (
                <button
                  type="button"
                  key={dashboard.component}
                  className={cn("dashboard-metrics-dashboard-item", dashboardIndex === index && "active")}
                  onClick={() => { setDashboardIndex(index); setPanelIndex(0) }}
                  aria-pressed={dashboardIndex === index}
                >
                  <BracesIcon aria-hidden="true" />
                  <span><code>{dashboard.component}</code><small>Version {dashboard.version}</small></span>
                  <Badge variant="outline">{dashboard.panels.length}</Badge>
                </button>
              ))}
            </ScrollArea>
            <div className="dashboard-metrics-detail">
              <header><div><span>COMPONENT</span><strong>{selectedDashboard?.component}</strong><small>{`Version ${selectedDashboard?.version} · ${selectedDashboard?.panels.length} panels`}</small></div><Badge variant="secondary">READ ONLY</Badge></header>
              <div className="dashboard-metrics-panel-workspace">
                <ScrollArea className="dashboard-metrics-panel-list">
                  {selectedDashboard?.panels.map((panel, index) => (
                    <button type="button" key={panel.id} className={cn("dashboard-metrics-panel-item", panelIndex === index && "active")} onClick={() => setPanelIndex(index)} aria-pressed={panelIndex === index}>
                      <span>{panel.title}</span><code>{panel.metric_name}</code>
                    </button>
                  ))}
                </ScrollArea>
                <div className="dashboard-metrics-json"><header><span>Panel metric JSON</span><code>{selectedPanel?.id}</code></header><pre>{JSON.stringify(selectedPanel, null, 2)}</pre></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
