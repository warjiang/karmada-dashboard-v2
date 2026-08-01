import * as React from "react"
import {
  ActivityIcon,
  BoxesIcon,
  CircleAlertIcon,
  DatabaseZapIcon,
  LoaderCircleIcon,
  SearchIcon,
  Settings2Icon,
  ShieldAlertIcon,
  Trash2Icon,
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type AddonId = "karmada-search" | "karmada-descheduler" | "karmada-metrics-adapter"
type AddonStatus = "not-installed" | "installing" | "ready" | "uninstalling" | "error"

interface ClusterSummary {
  freshness: string
  mode: string
  name: string
  status: string
  version: string
}

interface AddonConfig {
  image: string
  namespace: string
  priorityClass: string
  privateRegistry: string
  replicas: number
}

interface AddonState extends AddonConfig {
  status: AddonStatus
}

interface EstimatorState extends AddonConfig {
  context: string
  status: AddonStatus
}

interface AddonDefinition {
  description: string
  id: AddonId
  name: string
  role: string
}

interface PendingAction {
  id?: AddonId
  kind: "install-addon" | "uninstall-addon" | "install-estimator" | "uninstall-estimator"
  target?: string
}

interface ConfigureTarget {
  id?: AddonId
  kind: "addon" | "estimator"
  target?: string
}

const addonDefinitions: AddonDefinition[] = [
  {
    id: "karmada-search",
    name: "Karmada Search",
    role: "Global resource discovery",
    description: "Aggregates resource search and proxy access across the Karmada control plane and member clusters.",
  },
  {
    id: "karmada-descheduler",
    name: "Karmada Descheduler",
    role: "Replica rescheduling",
    description: "Evicts replicas that remain unschedulable so Karmada can place them on a more suitable member cluster.",
  },
  {
    id: "karmada-metrics-adapter",
    name: "Karmada Metrics Adapter",
    role: "Cross-cluster metrics",
    description: "Aggregates metrics from member clusters and exposes them through Kubernetes metrics APIs.",
  },
]

const addonIcons: Record<AddonId, React.ComponentType<{ className?: string }>> = {
  "karmada-search": SearchIcon,
  "karmada-descheduler": DatabaseZapIcon,
  "karmada-metrics-adapter": ActivityIcon,
}

const defaultImages: Record<AddonId | "karmada-scheduler-estimator", string> = {
  "karmada-search": "registry.k8s.io/karmada/karmada-search:v1.18.0",
  "karmada-descheduler": "registry.k8s.io/karmada/karmada-descheduler:v1.18.0",
  "karmada-metrics-adapter": "registry.k8s.io/karmada/karmada-metrics-adapter:v1.18.0",
  "karmada-scheduler-estimator": "registry.k8s.io/karmada/karmada-scheduler-estimator:v1.18.0",
}

function defaultConfig(image: string): AddonConfig {
  return {
    image,
    namespace: "karmada-system",
    priorityClass: "system-node-critical",
    privateRegistry: "",
    replicas: 1,
  }
}

function initialAddonState(): Record<AddonId, AddonState> {
  return Object.fromEntries(addonDefinitions.map(({ id }) => [id, {
    ...defaultConfig(defaultImages[id]),
    status: "not-installed" as const,
  }])) as Record<AddonId, AddonState>
}

function statusLabel(status: AddonStatus) {
  return {
    "not-installed": "Not installed",
    installing: "Installing",
    ready: "Ready",
    uninstalling: "Uninstalling",
    error: "Attention required",
  }[status]
}

function StatusBadge({ status }: { status: AddonStatus }) {
  const busy = status === "installing" || status === "uninstalling"
  return (
    <Badge
      variant={status === "error" ? "destructive" : status === "ready" ? "default" : "outline"}
      className={cn("font-normal", status === "ready" && "bg-emerald-600 text-white")}
      data-addon-status={status}
    >
      {busy && <LoaderCircleIcon className="animate-spin" />}
      {statusLabel(status)}
    </Badge>
  )
}

function Field({
  description,
  id,
  label,
  ...props
}: React.ComponentProps<typeof Input> & { description?: string; label: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  )
}

function ConfigurationDialog({
  addonName,
  config,
  open,
  target,
  onOpenChange,
  onSave,
}: {
  addonName: string
  config: AddonConfig & { context?: string }
  open: boolean
  target?: string
  onOpenChange: (open: boolean) => void
  onSave: (config: AddonConfig & { context?: string }) => void
}) {
  const [draft, setDraft] = React.useState(config)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setDraft(config)
      setError("")
    }
  }, [config, open])

  const save = () => {
    if (!draft.image.trim() || !draft.namespace.trim()) {
      setError("Namespace and image are required.")
      return
    }
    if (!Number.isInteger(draft.replicas) || draft.replicas < 1 || draft.replicas > 20) {
      setError("Replicas must be a whole number from 1 to 20.")
      return
    }
    if ("context" in draft && !draft.context?.trim()) {
      setError("Member context is required.")
      return
    }
    onSave(draft)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure {addonName}</DialogTitle>
          <DialogDescription>
            {target ? `Target member cluster: ${target}. ` : ""}These values match the supported karmadactl add-on flags.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[65vh] gap-5 overflow-y-auto py-1 sm:grid-cols-2">
          <Field
            id="addon-namespace"
            label="Namespace"
            value={draft.namespace}
            onChange={(event) => setDraft({ ...draft, namespace: event.target.value })}
          />
          <Field
            id="addon-replicas"
            label="Replicas"
            type="number"
            min={1}
            max={20}
            value={draft.replicas}
            onChange={(event) => setDraft({ ...draft, replicas: Number(event.target.value) })}
          />
          <Field
            id="addon-image"
            label="Image"
            className="font-mono text-xs"
            value={draft.image}
            onChange={(event) => setDraft({ ...draft, image: event.target.value })}
          />
          <Field
            id="addon-priority-class"
            label="Priority class"
            value={draft.priorityClass}
            onChange={(event) => setDraft({ ...draft, priorityClass: event.target.value })}
          />
          <Field
            id="addon-private-registry"
            label="Private registry"
            placeholder="Optional registry prefix"
            value={draft.privateRegistry}
            onChange={(event) => setDraft({ ...draft, privateRegistry: event.target.value })}
          />
          {"context" in draft && (
            <Field
              id="addon-member-context"
              label="Member context"
              description="The connected member kubeconfig remains managed outside this page. Sensitive content is not displayed."
              value={draft.context ?? ""}
              onChange={(event) => setDraft({ ...draft, context: event.target.value })}
            />
          )}
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
            <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={save}>Save configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddonsWorkspace({ clusters }: { clusters: ClusterSummary[] }) {
  const [addons, setAddons] = React.useState(initialAddonState)
  const [estimators, setEstimators] = React.useState<Record<string, EstimatorState>>(() => Object.fromEntries(clusters.map((cluster) => [cluster.name, {
    ...defaultConfig(defaultImages["karmada-scheduler-estimator"]),
    context: `${cluster.name}-admin`,
    status: "not-installed" as const,
  }])))
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null)
  const [configureTarget, setConfigureTarget] = React.useState<ConfigureTarget | null>(null)
  const [dependencyOpen, setDependencyOpen] = React.useState(false)
  const [dependencyTargets, setDependencyTargets] = React.useState<string[]>(() => clusters.filter((cluster) => cluster.status === "Ready").map((cluster) => cluster.name))
  const timers = React.useRef<number[]>([])

  React.useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const later = (callback: () => void) => {
    const timer = window.setTimeout(callback, 850)
    timers.current.push(timer)
  }

  const installedEstimatorNames = Object.entries(estimators)
    .filter(([, state]) => state.status === "ready")
    .map(([name]) => name)
  const busyCount = [...Object.values(addons), ...Object.values(estimators)]
    .filter(({ status }) => status === "installing" || status === "uninstalling").length
  const installedHostAddonCount = Object.values(addons).filter(({ status }) => status === "ready").length
  const installedComponentCount = installedHostAddonCount + (installedEstimatorNames.length > 0 ? 1 : 0)

  const installAddon = (id: AddonId) => {
    if (id === "karmada-descheduler" && installedEstimatorNames.length === 0) {
      setDependencyOpen(true)
      return
    }
    setAddons((current) => ({ ...current, [id]: { ...current[id], status: "installing" } }))
    later(() => {
      setAddons((current) => ({ ...current, [id]: { ...current[id], status: "ready" } }))
      const name = addonDefinitions.find((definition) => definition.id === id)?.name ?? id
      toast.success(`${name} installed`, { description: "Prototype state updated in karmada-system." })
    })
  }

  const uninstallAddon = (id: AddonId) => {
    setAddons((current) => ({ ...current, [id]: { ...current[id], status: "uninstalling" } }))
    later(() => {
      setAddons((current) => ({ ...current, [id]: { ...current[id], status: "not-installed" } }))
      const name = addonDefinitions.find((definition) => definition.id === id)?.name ?? id
      toast.success(`${name} uninstalled`, { description: "The prototype deployment state was removed." })
    })
  }

  const installEstimator = (target: string) => {
    setEstimators((current) => ({ ...current, [target]: { ...current[target], status: "installing" } }))
    later(() => {
      setEstimators((current) => ({ ...current, [target]: { ...current[target], status: "ready" } }))
      toast.success(`Scheduler Estimator installed on ${target}`, { description: "The member-cluster deployment is ready." })
    })
  }

  const uninstallEstimator = (target: string) => {
    if (addons["karmada-descheduler"].status === "ready" && installedEstimatorNames.length === 1 && installedEstimatorNames[0] === target) {
      toast.error("Scheduler Estimator is required", { description: "Uninstall Karmada Descheduler before removing its last estimator." })
      return
    }
    setEstimators((current) => ({ ...current, [target]: { ...current[target], status: "uninstalling" } }))
    later(() => {
      setEstimators((current) => ({ ...current, [target]: { ...current[target], status: "not-installed" } }))
      toast.success(`Scheduler Estimator removed from ${target}`)
    })
  }

  const confirmAction = () => {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)
    if (action.kind === "install-addon" && action.id) installAddon(action.id)
    if (action.kind === "uninstall-addon" && action.id) uninstallAddon(action.id)
    if (action.kind === "install-estimator" && action.target) installEstimator(action.target)
    if (action.kind === "uninstall-estimator" && action.target) uninstallEstimator(action.target)
  }

  const installDependencyAndDescheduler = () => {
    if (dependencyTargets.length === 0) return
    setDependencyOpen(false)
    setEstimators((current) => {
      const next = { ...current }
      dependencyTargets.forEach((target) => { next[target] = { ...next[target], status: "installing" } })
      return next
    })
    setAddons((current) => ({ ...current, "karmada-descheduler": { ...current["karmada-descheduler"], status: "installing" } }))
    later(() => {
      setEstimators((current) => {
        const next = { ...current }
        dependencyTargets.forEach((target) => { next[target] = { ...next[target], status: "ready" } })
        return next
      })
      setAddons((current) => ({ ...current, "karmada-descheduler": { ...current["karmada-descheduler"], status: "ready" } }))
      toast.success("Descheduler stack installed", { description: `Scheduler Estimator is ready on ${dependencyTargets.join(", ")}.` })
    })
  }

  const configSource = configureTarget?.kind === "addon" && configureTarget.id
    ? addons[configureTarget.id]
    : configureTarget?.target
      ? estimators[configureTarget.target]
      : null
  const configName = configureTarget?.kind === "addon" && configureTarget.id
    ? addonDefinitions.find(({ id }) => id === configureTarget.id)?.name ?? configureTarget.id
    : "Karmada Scheduler Estimator"
  const actionName = pendingAction?.id
    ? addonDefinitions.find(({ id }) => id === pendingAction.id)?.name ?? pendingAction.id
    : "Karmada Scheduler Estimator"
  const destructiveAction = pendingAction?.kind.startsWith("uninstall") ?? false

  return (
    <div className="addons-workspace grid gap-4" data-testid="addons-workspace">
      <Card className="addons-panel overflow-hidden rounded-lg shadow-none">
        <CardHeader className="addons-panel-header border-b pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <BoxesIcon className="size-5 text-primary" />
              <CardTitle className="text-base">Karmada add-ons</CardTitle>
            </div>
            <CardDescription className="leading-relaxed">
              Install and manage the four components supported by <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">karmadactl addons enable</code>. Lifecycle actions below update this interactive prototype only.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className="font-normal">Components installed: {installedComponentCount} / 4</Badge>
            {installedEstimatorNames.length > 0 && <Badge variant="secondary" className="font-normal">{installedEstimatorNames.length} estimator targets</Badge>}
            {busyCount > 0 && <Badge variant="secondary" className="font-normal"><LoaderCircleIcon className="animate-spin" />{busyCount} in progress</Badge>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="addons-component-list divide-y">
            {addonDefinitions.map((definition) => {
              const state = addons[definition.id]
              const Icon = addonIcons[definition.id]
              const busy = state.status === "installing" || state.status === "uninstalling"
              return (
                <section key={definition.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(16rem,1fr)_minmax(14rem,.7fr)_auto] lg:items-center" data-addon-id={definition.id}>
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-background text-primary"><Icon className="size-4" /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-foreground">{definition.name}</h3>
                        <StatusBadge status={state.status} />
                      </div>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">{definition.role}</p>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{definition.description}</p>
                    </div>
                  </div>
                  <dl className="grid min-w-0 gap-1 text-xs">
                    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2"><dt className="text-muted-foreground">Deployment</dt><dd className="truncate font-medium">karmada-system · host cluster</dd></div>
                    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2"><dt className="text-muted-foreground">Image</dt><dd className="truncate font-mono">{state.image}</dd></div>
                    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2"><dt className="text-muted-foreground">Replicas</dt><dd>{state.replicas}</dd></div>
                  </dl>
                  <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setConfigureTarget({ kind: "addon", id: definition.id })}>
                      <Settings2Icon />Configure
                    </Button>
                    {state.status === "ready" ? (
                      <Button type="button" size="sm" variant="outline" disabled={busy} className="text-destructive hover:text-destructive" onClick={() => setPendingAction({ kind: "uninstall-addon", id: definition.id })}>
                        <Trash2Icon />Uninstall
                      </Button>
                    ) : (
                      <Button type="button" size="sm" disabled={busy} onClick={() => setPendingAction({ kind: "install-addon", id: definition.id })}>
                        {state.status === "installing" ? <LoaderCircleIcon className="animate-spin" /> : <BoxesIcon />}Install
                      </Button>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="addons-panel overflow-hidden rounded-lg shadow-none" data-addon-id="karmada-scheduler-estimator">
        <CardHeader className="addons-panel-header border-b pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <ShieldAlertIcon className="size-5 text-primary" />
              <CardTitle className="text-base">Karmada Scheduler Estimator</CardTitle>
            </div>
            <CardDescription className="leading-relaxed">
              Install per member cluster for more accurate scheduling estimates. Descheduler requires at least one ready estimator.
            </CardDescription>
          </div>
          <Badge variant="outline" className="mt-1 font-normal">Cluster scoped · excluded from “enable all”</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="addons-estimator-table" data-column-visibility="fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Member cluster</TableHead>
                <TableHead>Connection</TableHead>
                <TableHead>Estimator</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clusters.map((cluster) => {
                const state = estimators[cluster.name]
                if (!state) return null
                const stale = cluster.status !== "Ready"
                const busy = state.status === "installing" || state.status === "uninstalling"
                return (
                  <TableRow key={cluster.name} data-estimator-cluster={cluster.name}>
                    <TableCell>
                      <div className="grid gap-1">
                        <span className="font-medium text-foreground">{cluster.name}</span>
                        <span className="text-xs text-muted-foreground">Kubernetes {cluster.version}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={stale ? "destructive" : "outline"} className="font-normal">{cluster.status}</Badge>
                        <span className="text-xs text-muted-foreground">{cluster.mode} · {cluster.freshness}</span>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={state.status} /></TableCell>
                    <TableCell>
                      <div className="grid gap-1 text-xs">
                        <span>{state.replicas} replica · <code>{state.context}</code></span>
                        <span className="max-w-[20rem] truncate font-mono text-muted-foreground">{state.image}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" disabled={busy || stale} onClick={() => setConfigureTarget({ kind: "estimator", target: cluster.name })}>
                          <Settings2Icon />Configure
                        </Button>
                        {state.status === "ready" ? (
                          <Button type="button" size="sm" variant="outline" disabled={busy} className="text-destructive hover:text-destructive" onClick={() => setPendingAction({ kind: "uninstall-estimator", target: cluster.name })}>
                            <Trash2Icon />Uninstall
                          </Button>
                        ) : (
                          <Button type="button" size="sm" disabled={busy || stale} onClick={() => setPendingAction({ kind: "install-estimator", target: cluster.name })}>
                            {state.status === "installing" ? <LoaderCircleIcon className="animate-spin" /> : <BoxesIcon />}Install
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {clusters.some((cluster) => cluster.status !== "Ready") && (
            <div className="addons-estimator-notice flex items-start gap-2 border-t bg-amber-50/70 px-5 py-3 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
              Installation is disabled for stale member clusters. Restore the cluster connection before deploying Scheduler Estimator.
            </div>
          )}
        </CardContent>
      </Card>

      {configSource && (
        <ConfigurationDialog
          addonName={configName}
          config={configSource}
          open
          target={configureTarget?.target}
          onOpenChange={(open) => !open && setConfigureTarget(null)}
          onSave={(next) => {
            if (configureTarget?.kind === "addon" && configureTarget.id) {
              setAddons((current) => ({ ...current, [configureTarget.id!]: { ...current[configureTarget.id!], ...next } }))
            } else if (configureTarget?.target) {
              setEstimators((current) => ({ ...current, [configureTarget.target!]: { ...current[configureTarget.target!], ...next } as EstimatorState }))
            }
            setConfigureTarget(null)
            toast.success("Add-on configuration saved", { description: "The updated values will be used by the next lifecycle action." })
          }}
        />
      )}

      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{destructiveAction ? `Uninstall ${actionName}?` : `Install ${actionName}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.target
                ? `${destructiveAction ? "Remove from" : "Deploy to"} member cluster ${pendingAction.target}.`
                : `${destructiveAction ? "Remove the deployment from" : "Deploy into"} karmada-system on the host cluster.`}
              {destructiveAction ? " Existing configuration is retained in this prototype." : " Review configuration before continuing if you need custom values."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            This is an interactive design prototype; no Kubernetes API request or cluster write will occur.
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant={destructiveAction ? "destructive" : "default"} onClick={confirmAction}>
              {destructiveAction ? "Uninstall" : "Install"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dependencyOpen} onOpenChange={setDependencyOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Scheduler Estimator is required</DialogTitle>
            <DialogDescription>
              Karmada Descheduler relies on Scheduler Estimator. Select the ready member clusters that should receive the dependency first.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {clusters.map((cluster) => {
              const disabled = cluster.status !== "Ready"
              const checked = dependencyTargets.includes(cluster.name)
              return (
                <Label key={cluster.name} className={cn("flex items-center justify-between rounded-md border p-3", disabled && "opacity-55")}>
                  <span className="flex items-center gap-3">
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(value) => setDependencyTargets((current) => value === true
                        ? [...new Set([...current, cluster.name])]
                        : current.filter((name) => name !== cluster.name))}
                    />
                    <span className="grid gap-1">
                      <span>{cluster.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">{cluster.mode} mode · {cluster.status}</span>
                    </span>
                  </span>
                  {disabled && <Badge variant="destructive" className="font-normal">Unavailable</Badge>}
                </Label>
              )
            })}
          </div>
          {dependencyTargets.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-destructive" role="alert">
              <CircleAlertIcon className="size-4" />Select at least one ready member cluster.
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDependencyOpen(false)}>Cancel</Button>
            <Button type="button" disabled={dependencyTargets.length === 0} onClick={installDependencyAndDescheduler}>
              Install dependency and Descheduler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
