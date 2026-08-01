import type { ReactNode } from "react"
import { Share2Icon, SlidersHorizontalIcon } from "lucide-react"

import { YamlCodeEditor } from "@/components/yaml-code-editor"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export interface AssociatedPolicyContext {
  apiVersion: string
  clusterScoped: boolean
  eligible: boolean
  kind: string
  name: string
  namespace: string
}

export interface AssociatedPolicyCluster {
  mode: string
  name: string
  status: string
}

export interface AssociatedPolicyConfig {
  override: {
    clusters: string[]
    enabled: boolean
    name: string
    path: string
    value: string
    yaml: string
  }
  propagation: {
    clusters: string[]
    enabled: boolean
    name: string
    yaml: string
  }
}

export interface CreateAssociatedPoliciesProps {
  clusters: AssociatedPolicyCluster[]
  context: AssociatedPolicyContext
  mode: "form" | "yaml"
  onChange: (config: AssociatedPolicyConfig) => void
  onPolicyYamlChange: (policy: "override" | "propagation", yaml: string) => void
  value: AssociatedPolicyConfig
}

function yamlValue(value: string) {
  if (!value) return '""'
  if (/^[a-zA-Z0-9._/@:-]+$/.test(value) && !/^(true|false|null|~|\d+(?:\.\d+)?)$/i.test(value)) return value
  return JSON.stringify(value)
}

export function buildAssociatedPolicyYaml(
  policy: "override" | "propagation",
  context: AssociatedPolicyContext,
  config: AssociatedPolicyConfig,
) {
  const current = config[policy]
  const kind = policy === "propagation"
    ? context.clusterScoped ? "ClusterPropagationPolicy" : "PropagationPolicy"
    : context.clusterScoped ? "ClusterOverridePolicy" : "OverridePolicy"
  const namespace = context.clusterScoped ? [] : [`  namespace: ${yamlValue(context.namespace || "default")}`]
  const selector = [
    "  resourceSelectors:",
    `    - apiVersion: ${context.apiVersion}`,
    `      kind: ${context.kind}`,
    `      name: ${yamlValue(context.name)}`,
  ]
  const lines = [
    "apiVersion: policy.karmada.io/v1alpha1",
    `kind: ${kind}`,
    "metadata:",
    `  name: ${yamlValue(current.name)}`,
    ...namespace,
    "spec:",
    ...selector,
  ]

  if (policy === "propagation") {
    lines.push(
      "  placement:",
      "    clusterAffinity:",
      "      clusterNames:",
      ...config.propagation.clusters.map((cluster) => `        - ${cluster}`),
    )
  } else {
    lines.push(
      "  overrideRules:",
      "    - targetCluster:",
      "        clusterNames:",
      ...config.override.clusters.map((cluster) => `          - ${cluster}`),
      "      overriders:",
      "        plaintext:",
      `          - path: ${yamlValue(config.override.path)}`,
      "            operator: replace",
      `            value: ${yamlValue(config.override.value)}`,
    )
  }
  return `${lines.join("\n")}\n`
}

function parseYamlScalar(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try {
      return trimmed.startsWith('"') ? JSON.parse(trimmed) : trimmed.slice(1, -1)
    } catch {
      return trimmed.slice(1, -1)
    }
  }
  return trimmed
}

function yamlClusterNames(yaml: string) {
  const block = yaml.match(/^\s*clusterNames:\s*\n((?:\s*-\s*[^\n]+\n?)*)/m)?.[1] || ""
  return [...block.matchAll(/^\s*-\s*(.+)$/gm)].map((match) => parseYamlScalar(match[1])).filter(Boolean)
}

export function parseAssociatedPolicyYaml(
  policy: "override" | "propagation",
  yaml: string,
  current: AssociatedPolicyConfig,
): AssociatedPolicyConfig {
  const metadata = yaml.match(/^metadata:\s*\n((?:[ \t]+.*(?:\n|$))*)/m)?.[1] || ""
  const name = parseYamlScalar(metadata.match(/^\s{2}name:\s*(.+)$/m)?.[1] || "")
  const clusters = yamlClusterNames(yaml)
  if (policy === "propagation") {
    return {
      ...current,
      propagation: {
        ...current.propagation,
        name,
        clusters,
        yaml,
      },
    }
  }
  const path = parseYamlScalar(yaml.match(/^\s*-\s*path:\s*(.+)$/m)?.[1] || "")
  const value = parseYamlScalar(yaml.match(/^\s*value:\s*(.+)$/m)?.[1] || "")
  return {
    ...current,
    override: {
      ...current.override,
      name,
      clusters,
      path,
      value,
      yaml,
    },
  }
}

function toggleCluster(clusters: string[], name: string, checked: boolean) {
  if (checked) return clusters.includes(name) ? clusters : [...clusters, name]
  return clusters.filter((cluster) => cluster !== name)
}

function ClusterSelector({
  clusters,
  idPrefix,
  selected,
  onChange,
}: {
  clusters: AssociatedPolicyCluster[]
  idPrefix: string
  selected: string[]
  onChange: (clusters: string[]) => void
}) {
  return (
    <fieldset className="associated-policy-clusters">
      <legend>Target member clusters</legend>
      <div>
        {clusters.map((cluster) => {
          const checked = selected.includes(cluster.name)
          const id = `associated-policy-${idPrefix}-${cluster.name}`
          return (
            <Label className="associated-policy-cluster" data-selected={checked} htmlFor={id} key={cluster.name}>
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(value) => onChange(toggleCluster(selected, cluster.name, value === true))}
              />
              <span>
                <strong>{cluster.name}</strong>
                <small>{cluster.mode} · {cluster.status}</small>
              </span>
            </Label>
          )
        })}
      </div>
    </fieldset>
  )
}

function PolicyCard({
  description,
  enabled,
  icon,
  kind,
  onEnabledChange,
  title,
  children,
}: {
  children: ReactNode
  description: string
  enabled: boolean
  icon: ReactNode
  kind: string
  onEnabledChange: (enabled: boolean) => void
  title: string
}) {
  return (
    <article className="associated-policy-card" data-enabled={enabled}>
      <header className="associated-policy-card-header">
        <span className="associated-policy-icon" aria-hidden="true">{icon}</span>
        <div>
          <div className="associated-policy-title-row">
            <strong>{title}</strong>
            <Badge variant="outline">{kind}</Badge>
          </div>
          <p>{description}</p>
        </div>
        <Switch
          checked={enabled}
          aria-label={`${enabled ? "Disable" : "Enable"} ${title}`}
          onCheckedChange={onEnabledChange}
        />
      </header>
      {enabled ? <div className="associated-policy-card-content">{children}</div> : null}
    </article>
  )
}

export function CreateAssociatedPolicies({
  clusters,
  context,
  mode,
  onChange,
  onPolicyYamlChange,
  value,
}: CreateAssociatedPoliciesProps) {
  if (!context.eligible) return null

  const propagationKind = context.clusterScoped ? "ClusterPropagationPolicy" : "PropagationPolicy"
  const overrideKind = context.clusterScoped ? "ClusterOverridePolicy" : "OverridePolicy"
  const selector = `${context.apiVersion || "v1"} · ${context.kind}/${context.name || "<resource-name>"}`
  const scope = context.clusterScoped ? "Cluster scoped" : context.namespace || "default"

  return (
    <section className="create-section associated-policies-section" aria-labelledby="associated-policies-title">
      <header>
        <span>04</span>
        <div>
          <h2 id="associated-policies-title">Associated policies</h2>
          <p>{mode === "yaml" ? "Edit the resource and its policies with the same YAML workflow." : "Create placement and override policies together with this resource."}</p>
        </div>
        <div className="associated-policy-context">
          <strong>{selector}</strong>
          <small>{scope}</small>
        </div>
      </header>
      <div className="create-section-body associated-policy-list">
        <PolicyCard
          title="Propagation Policy"
          description="Choose the member clusters that receive this resource."
          enabled={value.propagation.enabled}
          kind={propagationKind}
          icon={<Share2Icon />}
          onEnabledChange={(enabled) => onChange({ ...value, propagation: { ...value.propagation, enabled } })}
        >
          {mode === "yaml" ? (
            <YamlCodeEditor
              className="associated-policy-yaml-editor"
              value={value.propagation.yaml}
              label={`${propagationKind} YAML`}
              height={300}
              readOnly={false}
              onChange={(yaml) => onPolicyYamlChange("propagation", yaml)}
            />
          ) : <>
          <div className="associated-policy-fields">
            <div className="associated-policy-field">
              <Label htmlFor="associated-propagation-name">Policy name</Label>
              <Input
                id="associated-propagation-name"
                value={value.propagation.name}
                placeholder="resource-propagation"
                onChange={(event) => onChange({ ...value, propagation: { ...value.propagation, name: event.target.value } })}
              />
            </div>
            <div className="associated-policy-readonly">
              <span>Resource selector</span>
              <code>{selector}</code>
            </div>
          </div>
          <ClusterSelector
            clusters={clusters}
            idPrefix="propagation"
            selected={value.propagation.clusters}
            onChange={(selected) => onChange({ ...value, propagation: { ...value.propagation, clusters: selected } })}
          />
          </>}
        </PolicyCard>

        <PolicyCard
          title="Override Policy"
          description="Apply a JSON path replacement on selected member clusters."
          enabled={value.override.enabled}
          kind={overrideKind}
          icon={<SlidersHorizontalIcon />}
          onEnabledChange={(enabled) => onChange({ ...value, override: { ...value.override, enabled } })}
        >
          {mode === "yaml" ? (
            <YamlCodeEditor
              className="associated-policy-yaml-editor"
              value={value.override.yaml}
              label={`${overrideKind} YAML`}
              height={300}
              readOnly={false}
              onChange={(yaml) => onPolicyYamlChange("override", yaml)}
            />
          ) : <>
          <div className="associated-policy-fields associated-policy-override-fields">
            <div className="associated-policy-field">
              <Label htmlFor="associated-override-name">Policy name</Label>
              <Input
                id="associated-override-name"
                value={value.override.name}
                placeholder="resource-override"
                onChange={(event) => onChange({ ...value, override: { ...value.override, name: event.target.value } })}
              />
            </div>
            <div className="associated-policy-field">
              <Label htmlFor="associated-override-path">JSON path</Label>
              <Input
                id="associated-override-path"
                value={value.override.path}
                placeholder="/spec/replicas"
                onChange={(event) => onChange({ ...value, override: { ...value.override, path: event.target.value } })}
              />
            </div>
            <div className="associated-policy-field">
              <Label htmlFor="associated-override-value">Override value</Label>
              <Input
                id="associated-override-value"
                value={value.override.value}
                placeholder="3"
                onChange={(event) => onChange({ ...value, override: { ...value.override, value: event.target.value } })}
              />
            </div>
          </div>
          <ClusterSelector
            clusters={clusters}
            idPrefix="override"
            selected={value.override.clusters}
            onChange={(selected) => onChange({ ...value, override: { ...value.override, clusters: selected } })}
          />
          </>}
        </PolicyCard>
      </div>
    </section>
  )
}
