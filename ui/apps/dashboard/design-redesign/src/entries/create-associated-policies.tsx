import { createRoot } from "react-dom/client"

import {
  buildAssociatedPolicyYaml,
  CreateAssociatedPolicies,
  parseAssociatedPolicyYaml,
  type AssociatedPolicyConfig,
  type AssociatedPolicyContext,
  type CreateAssociatedPoliciesProps,
} from "@/components/create-associated-policies"

export interface CreateAssociatedPoliciesOptions {
  clusters: CreateAssociatedPoliciesProps["clusters"]
  context: AssociatedPolicyContext
  onChange?: (config: AssociatedPolicyConfig) => void
}

export interface CreateAssociatedPoliciesApi {
  getState: () => AssociatedPolicyConfig
  reset: () => void
  setContext: (context: AssociatedPolicyContext) => void
  setMode: (mode: "form" | "yaml") => void
}

function defaultPolicyName(name: string, suffix: string) {
  return `${name || "resource"}-${suffix}`
}

function createDefaultState(context: AssociatedPolicyContext, clusters: CreateAssociatedPoliciesProps["clusters"]): AssociatedPolicyConfig {
  const selectedClusters = clusters.filter((cluster) => !/stale/i.test(cluster.status)).map((cluster) => cluster.name)
  return {
    propagation: {
      enabled: false,
      name: defaultPolicyName(context.name, "propagation"),
      clusters: selectedClusters,
      yaml: "",
    },
    override: {
      enabled: false,
      name: defaultPolicyName(context.name, "override"),
      path: "/spec/replicas",
      value: "3",
      clusters: selectedClusters,
      yaml: "",
    },
  }
}

window.mountCreateAssociatedPolicies = (element, options) => {
  let context = { ...options.context }
  let mode: "form" | "yaml" = "form"
  let state = createDefaultState(context, options.clusters)
  const root = createRoot(element)

  const syncYamls = (config: AssociatedPolicyConfig) => ({
    ...config,
    propagation: {
      ...config.propagation,
      yaml: buildAssociatedPolicyYaml("propagation", context, config),
    },
    override: {
      ...config.override,
      yaml: buildAssociatedPolicyYaml("override", context, config),
    },
  })
  state = syncYamls(state)
  const publish = () => options.onChange?.(state)
  const render = () => {
    root.render(
      <CreateAssociatedPolicies
        clusters={options.clusters}
        context={context}
        mode={mode}
        value={state}
        onChange={(nextState) => {
          state = syncYamls(nextState)
          render()
          publish()
        }}
        onPolicyYamlChange={(policy, yaml) => {
          state = parseAssociatedPolicyYaml(policy, yaml, state)
          render()
          publish()
        }}
      />,
    )
  }

  const api: CreateAssociatedPoliciesApi = {
    getState: () => structuredClone(state),
    reset() {
      state = syncYamls(createDefaultState(context, options.clusters))
      render()
      publish()
    },
    setContext(nextContext) {
      const previousContext = context
      context = { ...nextContext }
      const nextPropagationDefault = defaultPolicyName(context.name, "propagation")
      const nextOverrideDefault = defaultPolicyName(context.name, "override")
      if (!state.propagation.name || state.propagation.name === defaultPolicyName(previousContext.name, "propagation")) {
        state = { ...state, propagation: { ...state.propagation, name: nextPropagationDefault } }
      }
      if (!state.override.name || state.override.name === defaultPolicyName(previousContext.name, "override")) {
        state = { ...state, override: { ...state.override, name: nextOverrideDefault } }
      }
      state = syncYamls(state)
      render()
      publish()
    },
    setMode(nextMode) {
      mode = nextMode
      render()
    },
  }

  render()
  publish()
  return api
}

window.dispatchEvent(new CustomEvent("create-associated-policies-ready"))
