import * as React from "react"
import { ChevronDownIcon, FileUpIcon, TagsIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react"

import { YamlCodeEditor } from "@/components/yaml-code-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type ClusterAccessMode = "Push" | "Pull"

export interface MetadataPair {
  id: string
  key: string
  value: string
}

export interface TaintPair extends MetadataPair {
  effect: "" | "NoSchedule" | "PreferNoSchedule" | "NoExecute"
}

export interface MemberClusterFormValue {
  accessMode: ClusterAccessMode
  clusterName: string
  kubeconfig: string
  labels: Array<Omit<MetadataPair, "id">>
  taints: Array<Omit<TaintPair, "id">>
}

export interface MemberClusterDialogOptions {
  existingNames: string[]
  initialValue?: MemberClusterFormValue
  mode?: "create" | "edit"
  onClose?: () => void
  onSubmit: (value: MemberClusterFormValue) => void
}

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function PairPreview({ pairs, taints = false }: { pairs: Array<MetadataPair | TaintPair>; taints?: boolean }) {
  const completed = pairs.filter((pair) => pair.key.trim() && pair.value.trim())
  if (!completed.length) return null
  return (
    <div className="cluster-pair-preview" aria-label={`${taints ? "Taint" : "Label"} preview`}>
      {completed.map((pair) => (
        <code key={pair.id}>
          <span>{pair.key.trim()}</span><b>=</b><span>{pair.value.trim()}</span>
          {taints && "effect" in pair && pair.effect ? <em>:{pair.effect}</em> : null}
        </code>
      ))}
    </div>
  )
}

function MetadataEditor({
  title,
  description,
  type,
  rows,
  onChange,
}: {
  title: string
  description: string
  type: "label" | "taint"
  rows: Array<MetadataPair | TaintPair>
  onChange: (rows: any[]) => void
}) {
  const isTaint = type === "taint"
  const addRow = () => onChange([...rows, isTaint ? { id: nextId(type), key: "", value: "", effect: "" } : { id: nextId(type), key: "", value: "" }])
  const updateRow = (id: string, patch: Partial<TaintPair>) => onChange(rows.map((row) => row.id === id ? { ...row, ...patch } : row))

  return (
    <section className="cluster-pair-editor">
      <div className="cluster-pair-editor-head">
        <div><h3>{title}</h3><p>{description}</p></div>
        <Button type="button" variant="outline" size="xs" className="cluster-pair-add" onClick={addRow}>Add {type}</Button>
      </div>
      {rows.length > 0 ? (
        <>
          <PairPreview pairs={rows} taints={isTaint} />
          <div className={`cluster-pair-table ${isTaint ? "has-effect" : ""}`}>
            <div className="cluster-pair-table-head" aria-hidden="true"><span>Key</span><i /><span>Value</span>{isTaint ? <span>Effect</span> : null}<i /></div>
            {rows.map((row) => (
              <div className="cluster-pair-row" key={row.id}>
                <Input aria-label={`${title} key`} value={row.key} placeholder={isTaint ? "dedicated" : "environment"} onChange={(event) => updateRow(row.id, { key: event.target.value })} />
                <span className="cluster-pair-equals" aria-hidden="true">=</span>
                <Input aria-label={`${title} value`} value={row.value} placeholder={isTaint ? "platform" : "production"} onChange={(event) => updateRow(row.id, { value: event.target.value })} />
                {isTaint && "effect" in row ? (
                  <Select value={row.effect} onValueChange={(effect) => updateRow(row.id, { effect: effect as TaintPair["effect"] })}>
                    <SelectTrigger aria-label={`${title} effect`} className="cluster-effect-select"><SelectValue placeholder="Select effect" /></SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="NoSchedule">NoSchedule</SelectItem>
                      <SelectItem value="PreferNoSchedule">PreferNoSchedule</SelectItem>
                      <SelectItem value="NoExecute">NoExecute</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${type}`} onClick={() => onChange(rows.filter((candidate) => candidate.id !== row.id))}><Trash2Icon /></Button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Button type="button" variant="outline" className="cluster-pair-empty" onClick={addRow} aria-label={`Add first ${type}`}>
          <TagsIcon />
          <span><strong>No {type}s yet</strong><small>Click to add optional scheduling metadata.</small></span>
        </Button>
      )}
    </section>
  )
}

export function MemberClusterDialog({ existingNames, initialValue, mode = "create", onClose, onSubmit }: MemberClusterDialogOptions) {
  const isEdit = mode === "edit"
  const [open, setOpen] = React.useState(true)
  const [clusterName, setClusterName] = React.useState(initialValue?.clusterName ?? "")
  const [accessMode, setAccessMode] = React.useState<ClusterAccessMode>(initialValue?.accessMode ?? "Push")
  const [kubeconfig, setKubeconfig] = React.useState(initialValue?.kubeconfig ?? "")
  const [labels, setLabels] = React.useState<MetadataPair[]>(() => initialValue?.labels.map((pair) => ({ id: nextId("label"), ...pair })) ?? [])
  const [taints, setTaints] = React.useState<TaintPair[]>(() => initialValue?.taints.map((pair) => ({ id: nextId("taint"), ...pair })) ?? [])
  const [advancedOpen, setAdvancedOpen] = React.useState(Boolean(initialValue?.labels.length || initialValue?.taints.length))
  const [fileName, setFileName] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const closedRef = React.useRef(false)

  const closeDialog = React.useCallback(() => {
    if (closedRef.current) return
    closedRef.current = true
    setOpen(false)
    window.setTimeout(() => onClose?.(), 180)
  }, [onClose])

  async function importKubeconfig(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const content = await file.text()
      setKubeconfig(content)
      setFileName(file.name)
      setErrors((current) => ({ ...current, kubeconfig: "" }))
    } catch {
      setErrors((current) => ({ ...current, kubeconfig: "Choose a readable kubeconfig file or paste its contents." }))
    }
  }

  function validatePairs() {
    const invalidLabel = labels.some((pair) => !pair.key.trim() || !pair.value.trim())
    const invalidTaint = taints.some((pair) => !pair.key.trim() || !pair.value.trim() || !pair.effect)
    return { invalidLabel, invalidTaint }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const normalizedName = clusterName.trim()
    if (!normalizedName) nextErrors.clusterName = "Cluster name is required."
    else if (!/^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/.test(normalizedName) || normalizedName.includes("..")) nextErrors.clusterName = "Use a DNS-compatible lowercase cluster name."
    else if (!isEdit && existingNames.some((name) => name.toLowerCase() === normalizedName.toLowerCase())) nextErrors.clusterName = "A member cluster with this name already exists."
    if (!kubeconfig.trim()) nextErrors.kubeconfig = "kubeconfig is required."
    const { invalidLabel, invalidTaint } = validatePairs()
    if (invalidLabel) nextErrors.labels = "Complete every label pair or remove the incomplete row."
    if (invalidTaint) nextErrors.taints = "Complete key, value, and effect for every taint."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      if (invalidLabel || invalidTaint) setAdvancedOpen(true)
      return
    }
    onSubmit({
      clusterName: normalizedName,
      accessMode,
      kubeconfig: kubeconfig.trim(),
      labels: labels.map(({ key, value }) => ({ key: key.trim(), value: value.trim() })),
      taints: taints.map(({ key, value, effect }) => ({ key: key.trim(), value: value.trim(), effect })),
    })
    closeDialog()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) closeDialog() }}>
      <DialogContent className="member-cluster-dialog max-w-[min(920px,calc(100vw-48px))] gap-0 overflow-hidden p-0 sm:max-w-[min(920px,calc(100vw-48px))]" showCloseButton>
        <DialogHeader className="member-cluster-dialog-header">
          <DialogTitle>{isEdit ? `Edit ${clusterName}` : "Add member cluster"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update the connection, credentials, labels, and taints for this member cluster." : "Register a Kubernetes cluster and choose how Karmada connects to it."}</DialogDescription>
        </DialogHeader>
        <form className="member-cluster-dialog-form" onSubmit={submit} noValidate>
          <div className="member-cluster-dialog-body">
            <Card className="member-cluster-section rounded-lg shadow-none">
              <CardContent className="member-cluster-section-content">
                <div className="member-cluster-section-index"><span>01</span><div><h3>Connection details</h3><p>Name the cluster, select an access mode, and provide credentials.</p></div></div>
                <div className="member-cluster-fields">
                <div className="member-cluster-field">
                  <Label htmlFor="shadcn-member-cluster-name">Cluster name <b>*</b></Label>
                  <Input id="shadcn-member-cluster-name" autoFocus={!isEdit} disabled={isEdit} value={clusterName} placeholder="for example, production-east" aria-invalid={Boolean(errors.clusterName)} onChange={(event) => { setClusterName(event.target.value); setErrors((current) => ({ ...current, clusterName: "" })) }} />
                  <small>{isEdit ? "Cluster names are immutable after registration." : "Lowercase letters, numbers, hyphens, and dots."}</small>
                  {errors.clusterName ? <em>{errors.clusterName}</em> : null}
                </div>

                <fieldset className="member-cluster-mode-field">
                  <legend>Access mode <b>*</b></legend>
                  <RadioGroup className="member-cluster-mode-grid" value={accessMode} onValueChange={(value) => setAccessMode(value as ClusterAccessMode)}>
                    {(["Push", "Pull"] as const).map((mode) => (
                      <Label className="member-cluster-mode-card" data-selected={accessMode === mode} key={mode} htmlFor={`cluster-mode-${mode.toLowerCase()}`}>
                        <RadioGroupItem id={`cluster-mode-${mode.toLowerCase()}`} value={mode} />
                        <span><b>{mode}</b><small>{mode === "Push" ? "Control plane connects directly to the member cluster API." : "The member agent pulls resources from the control plane."}</small></span>
                      </Label>
                    ))}
                  </RadioGroup>
                  <p>{accessMode === "Pull" ? "Best when the member cluster API is not directly reachable from the control plane." : "Best when the member cluster API is reachable from the control plane."}</p>
                </fieldset>

                <div className="member-cluster-field member-cluster-kubeconfig-field">
                  <div className="member-cluster-field-label-row">
                    <Label>kubeconfig <b>*</b></Label>
                    <input ref={fileInputRef} className="sr-only" type="file" accept=".yaml,.yml,.conf" onChange={importKubeconfig} />
                    <Button type="button" variant="outline" size="xs" className="member-kubeconfig-import" onClick={() => fileInputRef.current?.click()}><FileUpIcon />Import kubeconfig</Button>
                  </div>
                  <YamlCodeEditor className="member-kubeconfig-editor" value={kubeconfig} label="Cluster kubeconfig" height={230} readOnly={false} onChange={(value) => { setKubeconfig(value); setErrors((current) => ({ ...current, kubeconfig: "" })) }} />
                  <div className="member-kubeconfig-status"><span>{fileName ? `${fileName} loaded` : "Paste the complete kubeconfig or import a YAML file."}</span><code>YAML</code></div>
                  {errors.kubeconfig ? <em>{errors.kubeconfig}</em> : null}
                </div>
                </div>
              </CardContent>
            </Card>

            <Collapsible className="member-cluster-advanced" open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="member-cluster-advanced-trigger">
                  <span><b>Advanced configuration</b><small>Labels and taints used for placement and scheduling.</small></span>
                  <span className="member-cluster-advanced-count">{labels.length + taints.length ? `${labels.length + taints.length} configured` : "Optional"}</span>
                  <ChevronDownIcon />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="member-cluster-advanced-content">
                <MetadataEditor title="Cluster labels" description="Searchable metadata used by placement rules and inventory filters." type="label" rows={labels} onChange={setLabels} />
                {errors.labels ? <div className="cluster-pair-error"><TriangleAlertIcon />{errors.labels}</div> : null}
                <MetadataEditor title="Cluster taints" description="Scheduling constraints represented as key=value:effect." type="taint" rows={taints} onChange={setTaints} />
                {errors.taints ? <div className="cluster-pair-error"><TriangleAlertIcon />{errors.taints}</div> : null}
              </CollapsibleContent>
            </Collapsible>
          </div>
          <DialogFooter className="member-cluster-dialog-footer">
            <span>Required fields are marked with *</span>
            <div><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">{isEdit ? "Save changes" : "Add member cluster"}</Button></div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
