import * as React from "react"
import {
  ActivityIcon,
  ChevronDownIcon,
  GaugeIcon,
  RefreshCwIcon,
  RotateCwIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type RolloutState = "idle" | "pending" | "rolling"

interface KarmadaRuntimeConfig {
  controller: {
    deploymentReplicasSyncer: boolean
    gracefulEvictionTimeout: string
    hpaScaleTargetMarker: boolean
    resourceModeling: boolean
    skippedNamespaces: string
    taintManager: boolean
  }
  featureGates: {
    contextualLogging: boolean
    controllerPriorityQueue: boolean
    customizedClusterResourceModeling: boolean
    workloadAffinity: boolean
  }
  health: {
    failureThreshold: string
    monitorGracePeriod: string
    monitorPeriod: string
    startupGracePeriod: string
    statusUpdateFrequency: string
    successThreshold: string
  }
  performance: {
    bindingSyncs: string
    clusterApiBurst: string
    clusterApiQps: string
    kubeApiBurst: string
    kubeApiQps: string
    workSyncs: string
  }
  scheduler: {
    disableEstimatorInPullMode: boolean
    estimatorEnabled: boolean
    estimatorTimeout: string
    name: string
    plugins: Record<string, boolean>
  }
}

const initialConfig: KarmadaRuntimeConfig = {
  health: {
    monitorPeriod: "5s",
    monitorGracePeriod: "40s",
    startupGracePeriod: "1m",
    statusUpdateFrequency: "10s",
    failureThreshold: "30s",
    successThreshold: "30s",
  },
  controller: {
    resourceModeling: true,
    taintManager: true,
    gracefulEvictionTimeout: "10m",
    deploymentReplicasSyncer: false,
    hpaScaleTargetMarker: false,
    skippedNamespaces: "",
  },
  scheduler: {
    name: "default-scheduler",
    estimatorEnabled: false,
    disableEstimatorInPullMode: false,
    estimatorTimeout: "3s",
    plugins: {
      APIEnablement: true,
      ClusterAffinity: true,
      ClusterEviction: true,
      ClusterLocality: true,
      SpreadConstraint: true,
      TaintToleration: true,
    },
  },
  performance: {
    kubeApiQps: "40",
    kubeApiBurst: "60",
    clusterApiQps: "40",
    clusterApiBurst: "60",
    workSyncs: "5",
    bindingSyncs: "5",
  },
  featureGates: {
    contextualLogging: true,
    controllerPriorityQueue: true,
    customizedClusterResourceModeling: true,
    workloadAffinity: false,
  },
}

const pluginDescriptions: Record<string, string> = {
  APIEnablement: "Reject clusters that cannot serve the requested API.",
  ClusterAffinity: "Apply required and preferred cluster affinity.",
  ClusterEviction: "Exclude clusters currently under eviction.",
  ClusterLocality: "Prefer placements close to dependent resources.",
  SpreadConstraint: "Distribute workloads across topology domains.",
  TaintToleration: "Filter and score clusters by taints and tolerations.",
}

function cloneConfig(config: KarmadaRuntimeConfig) {
  return structuredClone(config)
}

function serializeConfig(config: KarmadaRuntimeConfig) {
  return JSON.stringify(config)
}

function ConfigField({
  description,
  flag,
  id,
  label,
  onChange,
  type = "text",
  value,
}: {
  description: string
  flag: string
  id: string
  label: string
  onChange: (value: string) => void
  type?: "number" | "text"
  value: string
}) {
  return (
    <div className="karmada-config-field">
      <div className="karmada-config-field-label">
        <Label htmlFor={id}>{label}</Label>
        <code>{flag}</code>
      </div>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      <small>{description}</small>
    </div>
  )
}

function ConfigSwitch({
  checked,
  description,
  flag,
  label,
  onCheckedChange,
  disabled = false,
}: {
  checked: boolean
  description: string
  disabled?: boolean
  flag: string
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className={cn("karmada-config-switch", disabled && "is-disabled")}>
      <div>
        <div className="karmada-config-switch-title"><strong>{label}</strong><code>{flag}</code></div>
        <small>{description}</small>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  )
}

function SectionCard({
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
    <Card className="karmada-config-card">
      <CardHeader className="karmada-config-card-header">
        <div className="karmada-config-card-heading">
          <span><Icon className="size-4" aria-hidden="true" /></span>
          <div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div>
        </div>
        {meta}
      </CardHeader>
      <CardContent className="karmada-config-card-body">{children}</CardContent>
    </Card>
  )
}

export function KarmadaConfigWorkspace() {
  const [config, setConfig] = React.useState(() => cloneConfig(initialConfig))
  const [savedConfig, setSavedConfig] = React.useState(() => cloneConfig(initialConfig))
  const [advancedOpen, setAdvancedOpen] = React.useState(false)
  const [rolloutState, setRolloutState] = React.useState<RolloutState>("idle")
  const configRef = React.useRef(config)
  const savedConfigRef = React.useRef(savedConfig)
  const hiddenStateRef = React.useRef<HTMLInputElement | null>(null)
  const rolloutTimerRef = React.useRef<number | null>(null)

  const draftChanged = serializeConfig(config) !== serializeConfig(savedConfig)

  React.useEffect(() => {
    configRef.current = config
  }, [config])

  React.useEffect(() => {
    savedConfigRef.current = savedConfig
  }, [savedConfig])

  React.useEffect(() => {
    hiddenStateRef.current = document.querySelector("[data-karmada-config-state]")
    const settingsRoot = document.querySelector("[data-settings-root]")
    const onSave = () => {
      if (serializeConfig(configRef.current) === serializeConfig(savedConfigRef.current)) return
      const nextSaved = cloneConfig(configRef.current)
      savedConfigRef.current = nextSaved
      setSavedConfig(nextSaved)
      setRolloutState("pending")
    }
    const onDiscard = () => {
      const restored = cloneConfig(savedConfigRef.current)
      configRef.current = restored
      setConfig(restored)
    }
    settingsRoot?.addEventListener("settings:save", onSave)
    settingsRoot?.addEventListener("settings:discard", onDiscard)
    return () => {
      settingsRoot?.removeEventListener("settings:save", onSave)
      settingsRoot?.removeEventListener("settings:discard", onDiscard)
      if (rolloutTimerRef.current) window.clearTimeout(rolloutTimerRef.current)
    }
  }, [])

  function commit(next: KarmadaRuntimeConfig) {
    configRef.current = next
    setConfig(next)
    if (hiddenStateRef.current) {
      hiddenStateRef.current.value = serializeConfig(next)
      hiddenStateRef.current.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }

  function updateSection<K extends keyof KarmadaRuntimeConfig>(
    section: K,
    patch: Partial<KarmadaRuntimeConfig[K]>,
  ) {
    commit({ ...configRef.current, [section]: { ...configRef.current[section], ...patch } })
  }

  function updatePlugin(plugin: string, checked: boolean) {
    updateSection("scheduler", { plugins: { ...configRef.current.scheduler.plugins, [plugin]: checked } })
  }

  function updateFeatureGate(gate: keyof KarmadaRuntimeConfig["featureGates"], checked: boolean) {
    updateSection("featureGates", { [gate]: checked })
  }

  function confirmRollout() {
    setRolloutState("rolling")
    toast.loading("Rolling out control-plane components", { id: "karmada-rollout" })
    rolloutTimerRef.current = window.setTimeout(() => {
      setRolloutState("idle")
      toast.success("Control-plane rollout completed", {
        id: "karmada-rollout",
        description: "karmada-controller-manager and karmada-scheduler are ready.",
      })
    }, 1800)
  }

  const enabledPlugins = Object.entries(config.scheduler.plugins).filter(([, enabled]) => enabled).map(([name]) => name)
  const featureGateArgs = Object.entries(config.featureGates).map(([name, enabled]) => `${name[0].toUpperCase()}${name.slice(1)}=${enabled}`).join(",")
  const controllerArgs = [
    `--cluster-monitor-period=${config.health.monitorPeriod}`,
    `--cluster-monitor-grace-period=${config.health.monitorGracePeriod}`,
    `--cluster-startup-grace-period=${config.health.startupGracePeriod}`,
    `--cluster-status-update-frequency=${config.health.statusUpdateFrequency}`,
    `--cluster-failure-threshold=${config.health.failureThreshold}`,
    `--cluster-success-threshold=${config.health.successThreshold}`,
    `--enable-cluster-resource-modeling=${config.controller.resourceModeling}`,
    `--enable-taint-manager=${config.controller.taintManager}`,
    `--graceful-eviction-timeout=${config.controller.gracefulEvictionTimeout}`,
  ]
  const schedulerArgs = [
    `--scheduler-name=${config.scheduler.name}`,
    `--plugins=${enabledPlugins.join(",")}`,
    `--enable-scheduler-estimator=${config.scheduler.estimatorEnabled}`,
    `--scheduler-estimator-timeout=${config.scheduler.estimatorTimeout}`,
    `--feature-gates=${featureGateArgs}`,
  ]

  return (
    <div className="karmada-config-workspace">
      <section className="karmada-config-intro" aria-label="Configuration source and rollout status">
        <div className="karmada-config-intro-copy">
          <span className="karmada-config-intro-icon"><Settings2Icon aria-hidden="true" /></span>
          <div>
            <div className="karmada-config-intro-title"><strong>Component startup arguments</strong><Badge variant="outline">Karmada v1.18</Badge><Badge variant="outline">karmadactl</Badge></div>
            <p>Settings are generated from official component flags. Saving stages a change; applying it performs a rolling restart of the affected workloads.</p>
          </div>
        </div>
        <div className="karmada-config-rollout-state">
          <span className={cn(rolloutState === "pending" && "pending", rolloutState === "rolling" && "rolling")}>
            {rolloutState === "idle" ? <ShieldCheckIcon /> : <RefreshCwIcon />}
          </span>
          <div><small>Rollout status</small><strong>{rolloutState === "pending" ? "2 components pending" : rolloutState === "rolling" ? "Rolling out components" : "Runtime is current"}</strong></div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" size="sm" variant={rolloutState === "pending" ? "default" : "outline"} disabled={rolloutState !== "pending"}>Review and roll out</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Roll out Karmada runtime changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  This restarts karmada-controller-manager and karmada-scheduler one workload at a time. Existing policies and member-cluster workloads remain available.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="karmada-rollout-review">
                <div><span>Workloads</span><strong>2 Deployments</strong></div>
                <div><span>Strategy</span><strong>RollingUpdate</strong></div>
                <div><span>Namespace</span><strong>karmada-system</strong></div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmRollout}>Start rollout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <SectionCard
        icon={ActivityIcon}
        title="Cluster health detection"
        description="Tune how quickly the controller manager detects member-cluster failures and recovery."
        meta={<Badge variant="outline">karmada-controller-manager</Badge>}
      >
        <div className="karmada-config-fields">
          <ConfigField id="cluster-monitor-period" label="Monitor interval" flag="--cluster-monitor-period" value={config.health.monitorPeriod} description="How often cluster health is evaluated. Default 5s." onChange={(value) => updateSection("health", { monitorPeriod: value })} />
          <ConfigField id="cluster-monitor-grace" label="Monitor grace period" flag="--cluster-monitor-grace-period" value={config.health.monitorGracePeriod} description="Unresponsive time before a running cluster is unhealthy. Default 40s." onChange={(value) => updateSection("health", { monitorGracePeriod: value })} />
          <ConfigField id="cluster-startup-grace" label="Startup grace period" flag="--cluster-startup-grace-period" value={config.health.startupGracePeriod} description="Grace period while a member cluster starts. Default 1m." onChange={(value) => updateSection("health", { startupGracePeriod: value })} />
          <ConfigField id="cluster-status-frequency" label="Status update frequency" flag="--cluster-status-update-frequency" value={config.health.statusUpdateFrequency} description="How often cluster status is posted. Default 10s." onChange={(value) => updateSection("health", { statusUpdateFrequency: value })} />
          <ConfigField id="cluster-failure-threshold" label="Failure threshold" flag="--cluster-failure-threshold" value={config.health.failureThreshold} description="Continuous failure duration required to become unhealthy. Default 30s." onChange={(value) => updateSection("health", { failureThreshold: value })} />
          <ConfigField id="cluster-success-threshold" label="Recovery threshold" flag="--cluster-success-threshold" value={config.health.successThreshold} description="Continuous success duration required to become healthy. Default 30s." onChange={(value) => updateSection("health", { successThreshold: value })} />
        </div>
        <div className="karmada-config-note"><ActivityIcon aria-hidden="true" /><span>Status update frequency should remain comfortably below the monitor grace period to avoid false failure detection.</span></div>
      </SectionCard>

      <SectionCard
        icon={SlidersHorizontalIcon}
        title="Controller manager"
        description="Control resource modeling, eviction behavior, and optional reconciliation loops."
        meta={<Badge variant="outline">Default controllers: *</Badge>}
      >
        <div className="karmada-config-switches">
          <ConfigSwitch checked={config.controller.resourceModeling} label="Cluster resource modeling" flag="--enable-cluster-resource-modeling" description="Sync Node and Pod capacity for dynamic replica assignment." onCheckedChange={(checked) => updateSection("controller", { resourceModeling: checked })} />
          <ConfigSwitch checked={config.controller.taintManager} label="Taint manager" flag="--enable-taint-manager" description="Evict propagated resources that do not tolerate NoExecute cluster taints." onCheckedChange={(checked) => updateSection("controller", { taintManager: checked })} />
        </div>
        <div className="karmada-config-fields compact">
          <ConfigField id="graceful-eviction-timeout" label="Graceful eviction timeout" flag="--graceful-eviction-timeout" value={config.controller.gracefulEvictionTimeout} description="Maximum wait before final removal. Default 10m." onChange={(value) => updateSection("controller", { gracefulEvictionTimeout: value })} />
        </div>
        <div className="karmada-config-subsection">
          <div className="karmada-config-subsection-heading"><div><strong>Optional controllers</strong><small>Disabled by default in Karmada v1.18.</small></div></div>
          <div className="karmada-config-options">
            <label><Checkbox checked={config.controller.deploymentReplicasSyncer} onCheckedChange={(checked) => updateSection("controller", { deploymentReplicasSyncer: checked === true })} /><span><strong>deploymentReplicasSyncer</strong><small>Synchronize Deployment replica status across clusters.</small></span></label>
            <label><Checkbox checked={config.controller.hpaScaleTargetMarker} onCheckedChange={(checked) => updateSection("controller", { hpaScaleTargetMarker: checked === true })} /><span><strong>hpaScaleTargetMarker</strong><small>Mark HPA scale targets for federated autoscaling.</small></span></label>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={GaugeIcon}
        title="Scheduler"
        description="Configure the scheduler identity, built-in plugins, and Scheduler Estimator integration."
        meta={<Badge variant="outline">karmada-scheduler</Badge>}
      >
        <div className="karmada-config-fields compact">
          <ConfigField id="scheduler-name" label="Scheduler name" flag="--scheduler-name" value={config.scheduler.name} description="Must match the schedulerName requested by policies. Default default-scheduler." onChange={(value) => updateSection("scheduler", { name: value })} />
        </div>
        <div className="karmada-config-subsection">
          <div className="karmada-config-subsection-heading"><div><strong>Built-in plugins</strong><small>The official default enables all six plugins.</small></div><Badge variant="secondary">{`${enabledPlugins.length} enabled`}</Badge></div>
          <div className="karmada-plugin-grid">
            {Object.entries(config.scheduler.plugins).map(([plugin, enabled]) => (
              <label key={plugin} className={cn(enabled && "selected")}>
                <Checkbox checked={enabled} onCheckedChange={(checked) => updatePlugin(plugin, checked === true)} />
                <span><strong>{plugin}</strong><small>{pluginDescriptions[plugin]}</small></span>
              </label>
            ))}
          </div>
        </div>
        <div className="karmada-config-switches scheduler-estimator-settings">
          <ConfigSwitch checked={config.scheduler.estimatorEnabled} label="Scheduler Estimator" flag="--enable-scheduler-estimator" description="Use cluster-side estimates when assigning replicas by available capacity." onCheckedChange={(checked) => updateSection("scheduler", { estimatorEnabled: checked })} />
          <ConfigSwitch disabled={!config.scheduler.estimatorEnabled} checked={config.scheduler.disableEstimatorInPullMode} label="Disable Estimator for Pull clusters" flag="--disable-scheduler-estimator-in-pull-mode" description="Skip estimator calls for agent-managed member clusters." onCheckedChange={(checked) => updateSection("scheduler", { disableEstimatorInPullMode: checked })} />
        </div>
        <div className={cn("karmada-config-fields compact", !config.scheduler.estimatorEnabled && "is-disabled")}>
          <ConfigField id="scheduler-estimator-timeout" label="Estimator timeout" flag="--scheduler-estimator-timeout" value={config.scheduler.estimatorTimeout} description="Maximum duration for an estimator request. Default 3s." onChange={(value) => updateSection("scheduler", { estimatorTimeout: value })} />
        </div>
      </SectionCard>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="karmada-config-advanced">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" className="karmada-config-advanced-trigger">
            <span><Settings2Icon aria-hidden="true" /><span><strong>Advanced runtime settings</strong><small>API throughput, reconciliation concurrency, feature gates, and propagation exclusions.</small></span></span>
            <ChevronDownIcon className={cn("karmada-config-chevron", advancedOpen && "open")} aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="karmada-config-advanced-content">
          <SectionCard icon={GaugeIcon} title="API throughput and concurrency" description="Increase these values only after checking API server saturation and controller queue depth.">
            <div className="karmada-config-fields">
              <ConfigField type="number" id="kube-api-qps" label="Karmada API QPS" flag="--kube-api-qps" value={config.performance.kubeApiQps} description="Sustained requests to karmada-apiserver. Default 40." onChange={(value) => updateSection("performance", { kubeApiQps: value })} />
              <ConfigField type="number" id="kube-api-burst" label="Karmada API burst" flag="--kube-api-burst" value={config.performance.kubeApiBurst} description="Short request burst limit. Default 60." onChange={(value) => updateSection("performance", { kubeApiBurst: value })} />
              <ConfigField type="number" id="cluster-api-qps" label="Member API QPS" flag="--cluster-api-qps" value={config.performance.clusterApiQps} description="Sustained requests to member APIs. Default 40." onChange={(value) => updateSection("performance", { clusterApiQps: value })} />
              <ConfigField type="number" id="cluster-api-burst" label="Member API burst" flag="--cluster-api-burst" value={config.performance.clusterApiBurst} description="Short member API burst limit. Default 60." onChange={(value) => updateSection("performance", { clusterApiBurst: value })} />
              <ConfigField type="number" id="work-syncs" label="Concurrent Work syncs" flag="--concurrent-work-syncs" value={config.performance.workSyncs} description="Work reconciliation workers. Default 5." onChange={(value) => updateSection("performance", { workSyncs: value })} />
              <ConfigField type="number" id="binding-syncs" label="Concurrent Binding syncs" flag="--concurrent-resourcebinding-syncs" value={config.performance.bindingSyncs} description="ResourceBinding reconciliation workers. Default 5." onChange={(value) => updateSection("performance", { bindingSyncs: value })} />
            </div>
          </SectionCard>

          <SectionCard icon={ShieldCheckIcon} title="Feature gates and propagation exclusions" description="Feature gates are component-scoped and may change between Karmada releases.">
            <div className="karmada-feature-gates">
              <ConfigSwitch checked={config.featureGates.contextualLogging} label="ContextualLogging" flag="BETA" description="Include request context in structured component logs." onCheckedChange={(checked) => updateFeatureGate("contextualLogging", checked)} />
              <ConfigSwitch checked={config.featureGates.controllerPriorityQueue} label="ControllerPriorityQueue" flag="BETA" description="Prioritize controller work queues for more predictable reconciliation." onCheckedChange={(checked) => updateFeatureGate("controllerPriorityQueue", checked)} />
              <ConfigSwitch checked={config.featureGates.customizedClusterResourceModeling} label="CustomizedClusterResourceModeling" flag="BETA" description="Enable custom resource models used by scheduling decisions." onCheckedChange={(checked) => updateFeatureGate("customizedClusterResourceModeling", checked)} />
              <ConfigSwitch checked={config.featureGates.workloadAffinity} label="WorkloadAffinity" flag="ALPHA" description="Allow workload-aware affinity during scheduling." onCheckedChange={(checked) => updateFeatureGate("workloadAffinity", checked)} />
            </div>
            <div className="karmada-config-fields compact">
              <ConfigField id="skipped-namespaces" label="Skipped namespaces" flag="--skipped-propagating-namespaces" value={config.controller.skippedNamespaces} description="Comma-separated namespaces that controller-manager must never propagate." onChange={(value) => updateSection("controller", { skippedNamespaces: value })} />
            </div>
          </SectionCard>
        </CollapsibleContent>
      </Collapsible>

      <section className="karmada-arguments-preview">
        <div className="karmada-arguments-preview-heading">
          <div><RotateCwIcon aria-hidden="true" /><span><strong>Generated component arguments</strong><small>{draftChanged ? "Draft differs from the saved runtime configuration." : "Arguments match the saved runtime configuration."}</small></span></div>
          <Badge variant={draftChanged ? "secondary" : "outline"}>{draftChanged ? "UNSAVED" : "CURRENT"}</Badge>
        </div>
        <div className="karmada-arguments-grid">
          <div><span>karmada-controller-manager</span><pre>{controllerArgs.join("\n")}</pre></div>
          <div><span>karmada-scheduler</span><pre>{schedulerArgs.join("\n")}</pre></div>
        </div>
      </section>
    </div>
  )
}
