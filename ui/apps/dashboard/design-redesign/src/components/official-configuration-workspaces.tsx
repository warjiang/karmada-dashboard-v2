import * as React from "react"
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDotIcon,
  ExternalLinkIcon,
  FileCode2Icon,
  GitCompareArrowsIcon,
  HistoryIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  PackageCheckIcon,
  PlayIcon,
  RefreshCwIcon,
  ServerCogIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type OfficialSection = "failover" | "permissions" | "reschedule" | "upgrade"

function OfficialCard({
  children,
  description,
  icon: Icon,
  meta,
  title,
}: {
  children: React.ReactNode
  description: string
  icon: React.ComponentType<{ className?: string }>
  meta?: React.ReactNode
  title: string
}) {
  return (
    <Card className="official-config-card">
      <CardHeader className="official-config-card-header">
        <div className="official-config-card-heading">
          <span><Icon className="size-4" aria-hidden="true" /></span>
          <div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div>
        </div>
        {meta}
      </CardHeader>
      <CardContent className="official-config-card-body">{children}</CardContent>
    </Card>
  )
}

function DocsLink({ href, label = "Official documentation" }: { href: string; label?: string }) {
  return (
    <Button type="button" variant="outline" size="sm" asChild>
      <a href={href} target="_blank" rel="noreferrer">{label}<ExternalLinkIcon aria-hidden="true" /></a>
    </Button>
  )
}

function UpgradeWorkspace() {
  const [checking, setChecking] = React.useState(false)
  const [checksPassed, setChecksPassed] = React.useState(false)
  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [upgrading, setUpgrading] = React.useState(false)
  const [complete, setComplete] = React.useState(false)
  const timerRef = React.useRef<number | null>(null)

  React.useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  const checks = [
    ["Upgrade instruction", "v1.15 to v1.16 changes reviewed"],
    ["Control-plane backup", "etcd snapshot completed 18 minutes ago"],
    ["CRD bundle", "Webhook CA can be injected into conversion patches"],
    ["Component images", "All v1.16.0 images are reachable"],
    ["API compatibility", "No removed APIs are currently stored"],
    ["Helm release", "karmada release is ready and has no pending operation"],
  ]

  function runChecks() {
    setChecking(true)
    setChecksPassed(false)
    timerRef.current = window.setTimeout(() => {
      setChecking(false)
      setChecksPassed(true)
    }, 1100)
  }

  function startUpgrade() {
    setReviewOpen(false)
    setUpgrading(true)
    timerRef.current = window.setTimeout(() => {
      setUpgrading(false)
      setComplete(true)
      toast.success("Upgrade simulation completed", { description: "CRDs and control-plane components now report v1.16.0." })
    }, 1800)
  }

  return (
    <div className="official-config-workspace">
      <section className="official-config-context">
        <div><PackageCheckIcon aria-hidden="true" /><span><strong>Installation method detected: Helm</strong><small>The upgrade workflow follows the official Helm path for the existing <code>karmada</code> release.</small></span></div>
        <DocsLink href="https://karmada.io/docs/administrator/upgrading/how-to-upgrade" />
      </section>

      <OfficialCard
        icon={GitCompareArrowsIcon}
        title="Upgrade plan"
        description="Upgrade APIs and components together, using the instructions for the next minor release."
        meta={<Badge variant="outline">Helm release · karmada</Badge>}
      >
        <div className="official-upgrade-path">
          <div><small>Current</small><strong>{complete ? "v1.16.0" : "v1.15.2"}</strong><span>Running</span></div>
          <GitCompareArrowsIcon aria-hidden="true" />
          <div><small>Target</small><strong>v1.16.0</strong><span>Next supported minor</span></div>
          <div><small>CRD source</small><strong>charts/karmada/_crds</strong><span>Base definitions + conversion patches</span></div>
        </div>
        <div className="official-command-preview">
          <span>Helm upgrade command</span>
          <code>helm upgrade karmada karmada-charts/karmada --namespace karmada-system --version v1.16.0 --reuse-values</code>
        </div>
        <div className="official-config-note warning"><TriangleAlertIcon aria-hidden="true" /><span>Review the v1.15 to v1.16 upgrade instruction for deprecated arguments before changing component images.</span></div>
      </OfficialCard>

      <OfficialCard
        icon={ShieldCheckIcon}
        title="Preflight checks"
        description="The official process requires a recoverable backup, compatible CRDs, and a healthy installation-specific upgrade path."
        meta={<Badge variant={checksPassed ? "secondary" : "outline"}>{checksPassed ? "6 PASSED" : "6 REQUIRED"}</Badge>}
      >
        <div className="official-check-list">
          {checks.map(([name, detail]) => (
            <div key={name} className={cn(checksPassed && "passed")}>
              {checksPassed ? <CheckCircle2Icon aria-hidden="true" /> : <CircleDotIcon aria-hidden="true" />}
              <span><strong>{name}</strong><small>{detail}</small></span>
              <Badge variant="outline">{checksPassed ? "Passed" : "Pending"}</Badge>
            </div>
          ))}
        </div>
        <div className="official-action-row">
          <Button type="button" variant="outline" onClick={runChecks} disabled={checking || upgrading}>
            {checking ? <LoaderCircleIcon className="animate-spin" /> : <ShieldCheckIcon />}{checking ? "Running checks" : "Run preflight checks"}
          </Button>
          {checksPassed ? <Button key="upgrade-ready" type="button" disabled={upgrading || complete} onClick={() => setReviewOpen(true)}>{upgrading ? <LoaderCircleIcon className="animate-spin" /> : <PlayIcon />}{complete ? "Upgrade completed" : "Review upgrade"}</Button> : <Button key="upgrade-blocked" type="button" disabled><PlayIcon />Review upgrade</Button>}
        </div>
        {reviewOpen ? <section className="official-inline-review" aria-label="Upgrade confirmation">
          <div><strong>Upgrade Karmada to v1.16.0?</strong><small>Helm will update the CRD bundle and roll the control-plane components. This prototype does not write to a cluster.</small></div>
          <div className="official-review-facts"><div><span>Release</span><strong>karmada</strong></div><div><span>Namespace</span><strong>karmada-system</strong></div><div><span>Target</span><strong>v1.16.0</strong></div></div>
          <div className="official-action-row"><Button type="button" variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button><Button type="button" onClick={startUpgrade}>Start upgrade</Button></div>
        </section> : null}
      </OfficialCard>
    </div>
  )
}

interface FailoverDraft {
  applicationEnabled: boolean
  applicationGracePeriod: string
  applicationPurgeMode: "Directly" | "Gracefully" | "Never"
  applicationToleration: string
  clusterEnabled: boolean
  clusterPurgeMode: "Directly" | "Gracefully"
}

const initialFailover: FailoverDraft = {
  applicationEnabled: false,
  applicationGracePeriod: "600",
  applicationPurgeMode: "Gracefully",
  applicationToleration: "300",
  clusterEnabled: true,
  clusterPurgeMode: "Gracefully",
}

function FailoverWorkspace() {
  const [draft, setDraft] = React.useState<FailoverDraft>(() => structuredClone(initialFailover))
  const savedRef = React.useRef(structuredClone(initialFailover))
  const draftRef = React.useRef(draft)
  const hiddenRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => { draftRef.current = draft }, [draft])
  React.useEffect(() => {
    hiddenRef.current = document.querySelector("[data-failover-config-state]")
    const settingsRoot = document.querySelector("[data-settings-root]")
    const onSave = () => { savedRef.current = structuredClone(draftRef.current) }
    const onDiscard = () => setDraft(structuredClone(savedRef.current))
    settingsRoot?.addEventListener("settings:save", onSave)
    settingsRoot?.addEventListener("settings:discard", onDiscard)
    return () => {
      settingsRoot?.removeEventListener("settings:save", onSave)
      settingsRoot?.removeEventListener("settings:discard", onDiscard)
    }
  }, [])

  function commit(patch: Partial<FailoverDraft>) {
    const next = { ...draftRef.current, ...patch }
    draftRef.current = next
    setDraft(next)
    if (hiddenRef.current) {
      hiddenRef.current.value = JSON.stringify(next)
      hiddenRef.current.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }

  const yaml = [
    "spec:",
    draft.applicationEnabled ? "  propagateDeps: true" : null,
    draft.applicationEnabled || draft.clusterEnabled ? "  failover:" : null,
    draft.applicationEnabled ? "    application:" : null,
    draft.applicationEnabled ? "      decisionConditions:" : null,
    draft.applicationEnabled ? `        tolerationSeconds: ${draft.applicationToleration}` : null,
    draft.applicationEnabled ? `      purgeMode: ${draft.applicationPurgeMode}` : null,
    draft.applicationEnabled && draft.applicationPurgeMode === "Gracefully" ? `      gracePeriodSeconds: ${draft.applicationGracePeriod}` : null,
    draft.clusterEnabled ? "    cluster:" : null,
    draft.clusterEnabled ? `      purgeMode: ${draft.clusterPurgeMode}` : null,
  ].filter(Boolean).join("\n") || "spec: {}"

  return (
    <div className="official-config-workspace">
      <section className="official-config-context">
        <div><FileCode2Icon aria-hidden="true" /><span><strong>Policy-scoped behavior</strong><small>These values generate <code>PropagationPolicy.spec.failover</code>. They are not global control-plane switches.</small></span></div>
        <DocsLink href="https://karmada.io/docs/reference/karmada-api/policy-resources/propagation-policy-v1alpha1" label="PropagationPolicy API" />
      </section>

      <div className="official-config-split">
        <div className="official-config-stack">
          <OfficialCard icon={RefreshCwIcon} title="Application failover" description="Migrate an unhealthy application after its interpreted health remains unhealthy for the configured tolerance." meta={<Switch checked={draft.applicationEnabled} onCheckedChange={(checked) => commit({ applicationEnabled: checked })} aria-label="Enable application failover" />}>
            <div className={cn("official-config-fields", !draft.applicationEnabled && "is-disabled")}>
              <div className="official-field"><Label htmlFor="application-toleration">Toleration seconds</Label><Input id="application-toleration" type="number" value={draft.applicationToleration} onChange={(event) => commit({ applicationToleration: event.target.value })} disabled={!draft.applicationEnabled} /><small><code>decisionConditions.tolerationSeconds</code>, default 300.</small></div>
              <div className="official-field"><Label>Purge mode</Label><Select value={draft.applicationPurgeMode} disabled={!draft.applicationEnabled} onValueChange={(value) => commit({ applicationPurgeMode: value as FailoverDraft["applicationPurgeMode"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Gracefully">Gracefully</SelectItem><SelectItem value="Directly">Directly</SelectItem><SelectItem value="Never">Never</SelectItem></SelectContent></Select><small>How the legacy copy is removed after migration.</small></div>
              <div className="official-field"><Label htmlFor="application-grace">Grace period seconds</Label><Input id="application-grace" type="number" value={draft.applicationGracePeriod} onChange={(event) => commit({ applicationGracePeriod: event.target.value })} disabled={!draft.applicationEnabled || draft.applicationPurgeMode !== "Gracefully"} /><small>Required for <code>Gracefully</code>, default 600.</small></div>
            </div>
            <div className="official-config-note"><CircleDotIcon aria-hidden="true" /><span>Application failover requires <code>propagateDeps: true</code> and a Resource Interpreter health rule for the selected workload kind.</span></div>
          </OfficialCard>

          <OfficialCard icon={ServerCogIcon} title="Cluster failover" description="Control legacy workload cleanup after a NoExecute taint triggers migration from a member cluster." meta={<Switch checked={draft.clusterEnabled} onCheckedChange={(checked) => commit({ clusterEnabled: checked })} aria-label="Enable cluster failover behavior" />}>
            <div className={cn("official-config-fields single", !draft.clusterEnabled && "is-disabled")}>
              <div className="official-field"><Label>Cluster purge mode</Label><Select value={draft.clusterPurgeMode} disabled={!draft.clusterEnabled} onValueChange={(value) => commit({ clusterPurgeMode: value as FailoverDraft["clusterPurgeMode"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Gracefully">Gracefully</SelectItem><SelectItem value="Directly">Directly</SelectItem></SelectContent></Select><small><code>spec.failover.cluster.purgeMode</code>, default Gracefully.</small></div>
            </div>
            <div className="official-config-note warning"><TriangleAlertIcon aria-hidden="true" /><span>State preservation remains excluded from this form because it requires the alpha <code>StatefulFailoverInjection</code> feature gate and workload-specific JSONPath rules.</span></div>
          </OfficialCard>
        </div>

        <aside className="official-yaml-preview">
          <div><span>Generated policy fragment</span><Badge variant="outline">v1alpha1</Badge></div>
          <pre>{yaml}</pre>
          <p>Apply this fragment to a PropagationPolicy or ClusterPropagationPolicy. A nil failover field disables failover for that policy.</p>
        </aside>
      </div>
    </div>
  )
}

interface BindingRow {
  clusters: string[]
  kind: "ClusterResourceBinding" | "ResourceBinding"
  lastScheduled: string
  name: string
  namespace?: string
  status: "Ready" | "Rescheduling"
}

const initialBindings: BindingRow[] = [
  { kind: "ResourceBinding", name: "nginx-deployment", namespace: "default", clusters: ["member1", "member2", "member3"], lastScheduled: "42 minutes ago", status: "Ready" },
  { kind: "ResourceBinding", name: "api-gateway-deployment", namespace: "platform", clusters: ["member1", "member2"], lastScheduled: "3 hours ago", status: "Ready" },
  { kind: "ClusterResourceBinding", name: "node-exporter-daemonset", clusters: ["member1", "member2", "member3"], lastScheduled: "1 day ago", status: "Ready" },
]

function RescheduleWorkspace() {
  const [bindings, setBindings] = React.useState(initialBindings)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [query, setQuery] = React.useState("")
  const timerRef = React.useRef<number | null>(null)

  React.useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current) }, [])

  const selected = bindings[selectedIndex]
  const filtered = bindings.map((row, index) => ({ row, index })).filter(({ row }) => `${row.kind}/${row.name}/${row.namespace ?? ""}`.toLowerCase().includes(query.toLowerCase()))

  function triggerReschedule() {
    setBindings((current) => current.map((row, index) => index === selectedIndex ? { ...row, status: "Rescheduling", lastScheduled: "Queued now" } : row))
    toast.success("Rescheduling triggered", { description: `${selected.kind}/${selected.name} will be recalculated from current cluster state.` })
    timerRef.current = window.setTimeout(() => {
      setBindings((current) => current.map((row, index) => index === selectedIndex ? { ...row, status: "Ready", lastScheduled: "Just now" } : row))
    }, 1600)
  }

  const patch = `spec:\n  rescheduleTriggeredAt: ${new Date("2026-07-30T07:00:00Z").toISOString()}`

  return (
    <div className="official-config-workspace">
      <section className="official-config-context">
        <div><HistoryIcon aria-hidden="true" /><span><strong>Binding operation, not a global policy</strong><small>Manual rescheduling updates <code>spec.rescheduleTriggeredAt</code> on a ResourceBinding or ClusterResourceBinding.</small></span></div>
        <DocsLink href="https://karmada.io/docs/reference/karmada-api/work-resources/resource-binding-v1alpha2" label="ResourceBinding API" />
      </section>

      <OfficialCard icon={RefreshCwIcon} title="Manual rescheduling" description="Select a binding to perform a complete scheduling recalculation without reusing the previous result." meta={<Badge variant="outline">{`${bindings.length} bindings`}</Badge>}>
        <div className="official-binding-toolbar"><div className="official-field"><Label htmlFor="binding-search">Find binding</Label><Input id="binding-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, namespace, or kind" /></div></div>
        <div className="official-binding-layout">
          <div className="official-binding-list">
            {filtered.map(({ row, index }) => <button type="button" key={`${row.kind}/${row.name}`} className={cn(index === selectedIndex && "active")} onClick={() => setSelectedIndex(index)}><span><strong>{row.name}</strong><small>{row.kind}{row.namespace ? ` · ${row.namespace}` : " · cluster-scoped"}</small></span><Badge variant={row.status === "Ready" ? "outline" : "secondary"}>{row.status}</Badge></button>)}
          </div>
          <div className="official-binding-detail">
            <div className="official-binding-detail-head"><div><span>{selected.kind}</span><strong>{selected.name}</strong><small>{selected.namespace ? `Namespace ${selected.namespace}` : "Cluster-scoped binding"}</small></div><Badge variant="outline">{`Last scheduled ${selected.lastScheduled}`}</Badge></div>
            <dl className="official-detail-facts"><div><dt>Target clusters</dt><dd>{selected.clusters.join(", ")}</dd></div><div><dt>Recalculation</dt><dd>Current policy, cluster health, taints, and available APIs</dd></div><div><dt>Trigger field</dt><dd><code>spec.rescheduleTriggeredAt</code></dd></div></dl>
            <div className="official-command-preview"><span>Merge patch preview</span><code>{patch}</code></div>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button type="button" disabled={selected.status === "Rescheduling"}>{selected.status === "Rescheduling" ? <LoaderCircleIcon className="animate-spin" /> : <RefreshCwIcon />}Trigger rescheduling</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Reschedule {selected.name}?</AlertDialogTitle><AlertDialogDescription>Karmada will discard the previous scheduling result and calculate placement again using current policy and cluster state. Existing workloads may move between member clusters.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={triggerReschedule}>Trigger rescheduling</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="official-config-note"><CircleDotIcon aria-hidden="true" /><span>Automatic recalculation already occurs when candidate clusters, relevant labels, or matching propagation policies change. There is no official global retry interval or maximum-attempts setting.</span></div>
      </OfficialCard>
    </div>
  )
}

const permissionRows = [
  { component: "karmada-operator", location: "Host cluster", scope: "Karmada lifecycle resources", access: "Scoped lifecycle manager", detail: "Karmada CRs, deployments, StatefulSets, services, secrets, PDBs, events, leases, and /healthz." },
  { component: "karmada-agent · member1", location: "Member cluster", scope: "All Kubernetes resources", access: "Cluster administrator", detail: "The agent acts as an administrator in its member cluster and has limited resource-specific access in the Karmada system." },
  { component: "karmada-agent · member2", location: "Member cluster", scope: "All Kubernetes resources", access: "Cluster administrator", detail: "The agent acts as an administrator in its member cluster and has limited resource-specific access in the Karmada system." },
  { component: "karmada-agent · member3", location: "Member cluster", scope: "All Kubernetes resources", access: "Cluster administrator", detail: "The agent acts as an administrator in its member cluster and has limited resource-specific access in the Karmada system." },
]

function PermissionsWorkspace() {
  const [expanded, setExpanded] = React.useState<string | null>("karmada-operator")
  return (
    <div className="official-config-workspace">
      <section className="official-config-context">
        <div><KeyRoundIcon aria-hidden="true" /><span><strong>Kubernetes RBAC is the source of truth</strong><small>Official installation tools provision component permissions using least-privilege Roles and ClusterRoles.</small></span></div>
        <div className="official-context-actions"><Button variant="outline" size="sm" asChild><a href="resources.html?resource=cluster-roles">Open Access control</a></Button><DocsLink href="https://karmada.io/docs/administrator/security/component-permission" /></div>
      </section>

      <OfficialCard icon={ShieldCheckIcon} title="Component permission audit" description="Review the permission boundary documented by Karmada for lifecycle and agent components." meta={<Badge variant="outline">4 identities</Badge>}>
        <div className="official-permission-table">
          <div className="official-permission-head"><span>Component</span><span>Runs in</span><span>Access level</span><span>Status</span></div>
          {permissionRows.map((row) => {
            const open = expanded === row.component
            return <div key={row.component} className={cn("official-permission-row", open && "open")}>
              <button type="button" aria-expanded={open} onClick={() => setExpanded(open ? null : row.component)}><ChevronDownIcon aria-hidden="true" /><strong>{row.component}</strong></button>
              <span>{row.location}</span><span>{row.access}</span><Badge variant="outline"><CheckCircle2Icon />Verified</Badge>
              {open ? <div className="official-permission-detail"><dl><div><dt>Resource scope</dt><dd>{row.scope}</dd></div><div><dt>Official description</dt><dd>{row.detail}</dd></div></dl>{row.component.startsWith("karmada-agent") ? <div className="official-config-note warning"><TriangleAlertIcon /><span>Agent mode intentionally requires administrator access in the member cluster. Protect its ServiceAccount token and certificate rotation path.</span></div> : null}</div> : null}
            </div>
          })}
        </div>
      </OfficialCard>

      <OfficialCard icon={KeyRoundIcon} title="User access belongs to API resources" description="Human and Dashboard access is managed with ServiceAccounts, Roles, ClusterRoles, and their bindings in the Karmada API server.">
        <div className="official-access-routing">
          <div className="official-access-route"><span>Authentication</span><strong>kube-apiserver startup configuration</strong><small>Certificates, tokens, OIDC, and request-header authentication are not a Dashboard default-role setting.</small></div>
          <div className="official-access-route"><span>Authorization</span><strong>Kubernetes RBAC resources</strong><small>Manage RoleBinding and ClusterRoleBinding objects from Access control.</small></div>
          <div className="official-access-action"><Button asChild><a href="resources.html?resource=cluster-role-bindings">Manage role bindings<ExternalLinkIcon /></a></Button></div>
        </div>
      </OfficialCard>
    </div>
  )
}

export function OfficialConfigurationWorkspace({ section }: { section: OfficialSection }) {
  if (section === "upgrade") return <UpgradeWorkspace />
  if (section === "failover") return <FailoverWorkspace />
  if (section === "reschedule") return <RescheduleWorkspace />
  return <PermissionsWorkspace />
}
