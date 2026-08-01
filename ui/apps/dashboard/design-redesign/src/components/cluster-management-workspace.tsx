import * as React from "react"
import {
  ActivityIcon,
  BoxesIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  NetworkIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import { MemberClusterDialog, type MemberClusterFormValue } from "@/components/member-cluster-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface ClusterManagementRow {
  cpu: string
  freshness: string
  memory: string
  mode: "Push" | "Pull"
  name: string
  nodes: number
  status: string
  version: string
}

export interface ClusterManagementWorkspaceProps {
  clusters: ClusterManagementRow[]
  initialView: "clusters" | "topology"
  topologyHtml: string
}

function statusTone(status: string) {
  if (/ready|healthy|connected|registering/i.test(status)) return "good"
  if (/stale|warning|pending/i.test(status)) return "warn"
  return "neutral"
}

function ClusterStatus({ status }: { status: string }) {
  const tone = statusTone(status)
  return (
    <Badge
      variant="outline"
      className="cluster-workspace-status gap-1.5 rounded-md font-mono text-[10px]"
      data-tone={tone}
    >
      <span aria-hidden="true" />
      {status}
    </Badge>
  )
}

function SummaryCell({ label, value, detail, warning = false }: { label: string; value: number; detail: string; warning?: boolean }) {
  return (
    <div className="cluster-workspace-summary-cell">
      <span>{label}</span>
      <strong className={warning ? "text-warn" : ""}>{value}</strong>
      <small className={warning ? "text-warn" : ""}>{detail}</small>
    </div>
  )
}

function defaultClusterConfig(cluster: ClusterManagementRow): MemberClusterFormValue {
  return {
    accessMode: cluster.mode,
    clusterName: cluster.name,
    kubeconfig: `apiVersion: v1\nkind: Config\ncurrent-context: ${cluster.name}\ncontexts:\n  - name: ${cluster.name}\n    context:\n      cluster: ${cluster.name}\n      user: karmada-dashboard`,
    labels: [],
    taints: [],
  }
}

export function ClusterManagementWorkspace({ clusters: initialClusters, initialView, topologyHtml }: ClusterManagementWorkspaceProps) {
  const [clusters, setClusters] = React.useState(initialClusters)
  const [activeView, setActiveView] = React.useState<"clusters" | "topology">(initialView)
  const [query, setQuery] = React.useState("")
  const [mode, setMode] = React.useState("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingCluster, setEditingCluster] = React.useState<ClusterManagementRow | null>(null)
  const [clusterConfigs, setClusterConfigs] = React.useState<Record<string, MemberClusterFormValue>>(() => Object.fromEntries(initialClusters.map((cluster) => [cluster.name, defaultClusterConfig(cluster)])))
  const topologyRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const onHashChange = () => setActiveView(location.hash === "#topology" ? "topology" : "clusters")
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const filteredClusters = React.useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return clusters.filter((cluster) => {
      const matchesMode = mode === "all" || cluster.mode.toLowerCase() === mode
      const matchesQuery = !normalized || [cluster.name, cluster.mode, cluster.status, cluster.version].join(" ").toLowerCase().includes(normalized)
      return matchesMode && matchesQuery
    })
  }, [clusters, mode, query])

  const counts = React.useMemo(() => ({
    connected: clusters.filter((cluster) => !/disconnected|registering/i.test(cluster.status)).length,
    push: clusters.filter((cluster) => cluster.mode === "Push").length,
    pull: clusters.filter((cluster) => cluster.mode === "Pull").length,
    stale: clusters.filter((cluster) => /stale/i.test(cluster.status)).length,
  }), [clusters])

  function changeView(value: string) {
    const next = value === "topology" ? "topology" : "clusters"
    setActiveView(next)
    history.replaceState(null, "", next === "topology" ? "#topology" : location.pathname)
  }

  function submitCluster(value: MemberClusterFormValue) {
    if (editingCluster) {
      setClusters((current) => current.map((cluster) => cluster.name === editingCluster.name ? { ...cluster, mode: value.accessMode, freshness: "Just now" } : cluster))
      setClusterConfigs((current) => ({ ...current, [editingCluster.name]: value }))
      window.KD_SHADCN?.toast("Member cluster updated", `${editingCluster.name} configuration was saved.`)
      return
    }
    setClusters((current) => [
      ...current,
      {
        cpu: "—",
        freshness: "Pending",
        memory: "—",
        mode: value.accessMode,
        name: value.clusterName,
        nodes: 0,
        status: "Registering",
        version: "Detecting",
      },
    ])
    setClusterConfigs((current) => ({ ...current, [value.clusterName]: value }))
    setActiveView("clusters")
    history.replaceState(null, "", location.pathname)
    window.KD_SHADCN?.toast("Member cluster registration started", `${value.clusterName} is being registered in ${value.accessMode.toLowerCase()} mode.`)
  }

  function editCluster(cluster: ClusterManagementRow) {
    setEditingCluster(cluster)
    setDialogOpen(true)
  }

  function deleteCluster(cluster: ClusterManagementRow) {
    window.KD_SHADCN?.openDialog({
      destructive: true,
      eyebrow: "Member cluster",
      title: `Delete ${cluster.name}?`,
      description: "This removes the member cluster from Karmada management. Workloads already running in the cluster are not deleted.",
      confirmLabel: "Delete cluster",
      confirmationLabel: "Type",
      confirmationValue: cluster.name,
      onConfirm: () => {
        setClusters((current) => current.filter((candidate) => candidate.name !== cluster.name))
        setClusterConfigs((current) => {
          const next = { ...current }
          delete next[cluster.name]
          return next
        })
        window.KD_SHADCN?.toast("Member cluster deleted", `${cluster.name} was removed from cluster management.`)
      },
    })
  }

  function handleTopologyClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    const root = topologyRef.current
    if (!root) return
    const close = target.closest("[data-topology-inspector-close]")
    const inspector = root.querySelector<HTMLElement>("[data-topology-inspector]")
    if (close && inspector) {
      inspector.hidden = true
      root.querySelectorAll("[data-topology-node]").forEach((node) => node.classList.remove("selected"))
      return
    }
    const node = target.closest<HTMLElement>("[data-topology-node]")
    if (!node || !inspector) return
    root.querySelectorAll("[data-topology-node]").forEach((candidate) => candidate.classList.toggle("selected", candidate === node))
    const setText = (selector: string, value = "") => { const element = inspector.querySelector(selector); if (element) element.textContent = value }
    setText("[data-inspector-kind]", node.dataset.topologyKind)
    setText("[data-inspector-title]", node.dataset.topologyTitle)
    setText("[data-inspector-status]", node.dataset.topologyStatus)
    setText("[data-inspector-detail]", node.dataset.topologyDetail)
    const health = inspector.querySelector("[data-inspector-health]")
    const warning = /stale|degraded/i.test(node.dataset.topologyStatus || "")
    health?.classList.toggle("good", !warning)
    health?.classList.toggle("warn", warning)
    const link = inspector.querySelector<HTMLAnchorElement>("[data-inspector-link]")
    if (link) {
      link.hidden = !node.dataset.topologyLink
      if (node.dataset.topologyLink) link.href = node.dataset.topologyLink
    }
    inspector.hidden = false
  }

  return (
    <div className="cluster-shadcn-workspace">
      <header className="cluster-workspace-header">
        <div>
          <h1>Member cluster management</h1>
          <p>Manage member clusters and inspect their live control-plane connections in one workspace.</p>
        </div>
        <Button
          type="button"
          variant="default"
          size="default"
          onClick={() => { setEditingCluster(null); setDialogOpen(true) }}
        >
          Add member cluster
        </Button>
      </header>

      <Card className="cluster-workspace-summary overflow-hidden rounded-lg shadow-xs">
        <CardContent className="grid grid-cols-4 p-0">
          <SummaryCell label="Connected" value={counts.connected} detail="API or agent reachable" />
          <SummaryCell label="Push mode" value={counts.push} detail="Direct connections" />
          <SummaryCell label="Pull mode" value={counts.pull} detail="Agent connections" />
          <SummaryCell label="Stale signals" value={counts.stale} detail={counts.stale ? "Review freshness" : "All signals current"} warning={counts.stale > 0} />
        </CardContent>
      </Card>

      <Tabs value={activeView} onValueChange={changeView} className="cluster-workspace-tabs">
        <TabsList className="h-10 w-fit">
          <TabsTrigger value="clusters" className="min-w-40"><BoxesIcon />Member clusters</TabsTrigger>
          <TabsTrigger value="topology" className="min-w-44"><NetworkIcon />Connection topology</TabsTrigger>
        </TabsList>

        <TabsContent value="clusters" className="cluster-workspace-inventory">
          <Card className="overflow-visible rounded-lg shadow-xs">
            <CardContent className="p-0">
              <div className="cluster-workspace-toolbar">
                <div className="cluster-workspace-search">
                  <SearchIcon aria-hidden="true" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} type="search" aria-label="Search member clusters" placeholder="Search member clusters" />
                </div>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="w-40" aria-label="Connection mode"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="pull">Pull</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table className="cluster-workspace-table">
                <TableHeader><TableRow><TableHead>Member cluster</TableHead><TableHead>Status</TableHead><TableHead>Kubernetes</TableHead><TableHead>Nodes</TableHead><TableHead>CPU</TableHead><TableHead>Memory</TableHead><TableHead>Freshness</TableHead><TableHead className="table-actions-header text-center">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredClusters.map((cluster) => (
                    <TableRow key={cluster.name}>
                      <TableCell><a className="cluster-workspace-name" href={`member-cluster.html?cluster=${encodeURIComponent(cluster.name)}#overview`}>{cluster.name}</a><small>{cluster.mode} mode</small></TableCell>
                      <TableCell><ClusterStatus status={cluster.status} /></TableCell>
                      <TableCell className="font-mono text-xs">{cluster.version}</TableCell>
                      <TableCell className="font-mono text-xs">{cluster.nodes || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{cluster.cpu}</TableCell>
                      <TableCell className="font-mono text-xs">{cluster.memory}</TableCell>
                      <TableCell className={/stale/i.test(cluster.status) ? "font-mono text-xs text-warn" : "font-mono text-xs"}>{cluster.freshness}</TableCell>
                      <TableCell className="table-actions-cell">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon-sm" className="table-action-trigger" aria-label={`Actions for ${cluster.name}`}>
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={6} className="w-52 p-1">
                            <DropdownMenuItem asChild className="min-h-9 gap-3 px-3">
                              <a href={`member-cluster.html?cluster=${encodeURIComponent(cluster.name)}#overview`}><ExternalLinkIcon />Details</a>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="min-h-9 gap-3 px-3" onSelect={() => editCluster(cluster)}><PencilIcon />Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" className="min-h-9 gap-3 px-3" onSelect={() => deleteCluster(cluster)}><Trash2Icon />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!filteredClusters.length ? <div className="cluster-workspace-empty"><ActivityIcon /><strong>No member clusters found</strong><span>Adjust the search query or connection-mode filter.</span></div> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topology">
          <div ref={topologyRef} onClick={handleTopologyClick} dangerouslySetInnerHTML={{ __html: topologyHtml }} />
        </TabsContent>
      </Tabs>

      {dialogOpen ? (
        <MemberClusterDialog
          existingNames={clusters.filter((cluster) => cluster.name !== editingCluster?.name).map((cluster) => cluster.name)}
          initialValue={editingCluster ? clusterConfigs[editingCluster.name] ?? defaultClusterConfig(editingCluster) : undefined}
          mode={editingCluster ? "edit" : "create"}
          onClose={() => { setDialogOpen(false); setEditingCluster(null) }}
          onSubmit={submitCluster}
        />
      ) : null}
    </div>
  )
}
