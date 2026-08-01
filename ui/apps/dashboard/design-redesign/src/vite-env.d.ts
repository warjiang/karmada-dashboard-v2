/// <reference types="vite/client" />

export {};

declare global {
  interface Window {
    KD_ASSETS: {
      kubernetesLogo: string;
      logo: string;
    };
    KD_REFRESH: {
      run: (
        button: HTMLButtonElement,
        onComplete?: () => void,
        options?: { busyLabel?: string; duration?: number; idleLabel?: string },
      ) => boolean;
    };
    KD_I18N?: {
      apply: (root?: Element) => void;
      getLanguage: () => "en" | "zh";
      t: (value: string) => string;
    };
    KD_DASHBOARD_CONFIG?: import("@/components/dashboard-config-workspace").DashboardConfig;
    KD_DASHBOARD_CONFIG_YAML?: string;
    KD_SHADCN?: {
      closeOverlay: () => void;
      openDialog: (options: import("@/entries/shadcn-bridge").ShadcnDialogOptions) => void;
      openWorkspaceDialog: (options: import("@/entries/shadcn-bridge").ShadcnWorkspaceDialogOptions) => void;
      openSheet: (options: import("@/entries/shadcn-bridge").ShadcnSheetOptions) => void;
      openYamlDialog: (options: import("@/entries/shadcn-bridge").ShadcnYamlDialogOptions) => void;
      toast: (title: string, detail?: string) => void;
    };
    mountShadcnControlColumns?: (
      element: HTMLElement,
      options: {
        columns: [key: string, label: string, type?: string][];
        title: string;
        viewId: string;
      },
    ) => void;
    mountShadcnSelect?: (
      element: HTMLElement,
      options: import("@/entries/shadcn-selects").ShadcnSelectMountOptions,
    ) => import("@/entries/shadcn-selects").ShadcnSelectApi;
    mountShadcnSearchInput?: (
      element: HTMLElement,
      options: import("@/entries/shadcn-inputs").ShadcnSearchInputOptions,
    ) => import("@/entries/shadcn-inputs").ShadcnSearchInputApi;
    mountGlobalTopologyFlow?: (
      element: HTMLElement,
      options: import("@/components/global-topology-flow").GlobalTopologyFlowProps,
    ) => import("@/components/global-topology-flow").GlobalTopologyApi;
    mountMetricsDashboard?: (
      element: HTMLElement,
      initialState: import("@/components/metrics-dashboard").MetricsDashboardState,
    ) => import("@/components/metrics-dashboard").MetricsDashboardApi;
    mountCreateAssociatedPolicies?: (
      element: HTMLElement,
      options: import("@/entries/create-associated-policies").CreateAssociatedPoliciesOptions,
    ) => import("@/entries/create-associated-policies").CreateAssociatedPoliciesApi;
    syncCreateShadcnControls?: (root?: ParentNode) => void;
    mountShadcnClusterManagement?: (
      element: HTMLElement,
      options: import("@/components/cluster-management-workspace").ClusterManagementWorkspaceProps,
    ) => void;
    KD_MOCK?: {
      clusters?: Array<{
        freshness: string;
        mode: string;
        name: string;
        status: string;
        version: string;
      }>;
      [key: string]: unknown;
    };
  }
}
