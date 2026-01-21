/*
Copyright 2024 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { ResourceDependency } from '@/components/common/LoadingFeedback';
import { 
  ConfigMapResource, 
  SecretResource, 
  PersistentVolumeClaimResource,
  ServiceResource,
  IngressResource,
  WorkloadKind,
  ConfigKind,
  ServiceKind
} from '@/services/base';

// Resource dependency analyzer
export class ResourceDependencyAnalyzer {
  /**
   * Analyze dependencies for a ConfigMap
   */
  static analyzeConfigMapDependencies(
    configMap: ConfigMapResource,
    relatedResources?: any[]
  ): ResourceDependency[] {
    const dependencies: ResourceDependency[] = [];

    // Check for mounted pods
    if (relatedResources) {
      const mountingPods = relatedResources.filter(resource => 
        resource.kind === 'Pod' && 
        this.isConfigMapMountedInPod(configMap, resource)
      );

      mountingPods.forEach(pod => {
        dependencies.push({
          type: 'mount',
          resourceType: 'Pod',
          resourceName: pod.metadata?.name || 'unknown',
          namespace: pod.metadata?.namespace,
          description: 'Pod will lose access to configuration data',
          severity: 'error'
        });
      });

      // Check for deployments using this ConfigMap
      const usingDeployments = relatedResources.filter(resource =>
        resource.kind === 'Deployment' &&
        this.isConfigMapUsedInDeployment(configMap, resource)
      );

      usingDeployments.forEach(deployment => {
        dependencies.push({
          type: 'reference',
          resourceType: 'Deployment',
          resourceName: deployment.metadata?.name || 'unknown',
          namespace: deployment.metadata?.namespace,
          description: 'Deployment pods will fail to start without this ConfigMap',
          severity: 'error'
        });
      });
    }

    return dependencies;
  }

  /**
   * Analyze dependencies for a Secret
   */
  static analyzeSecretDependencies(
    secret: SecretResource,
    relatedResources?: any[]
  ): ResourceDependency[] {
    const dependencies: ResourceDependency[] = [];

    if (relatedResources) {
      // Check for pods using this secret
      const usingPods = relatedResources.filter(resource =>
        resource.kind === 'Pod' &&
        this.isSecretUsedInPod(secret, resource)
      );

      usingPods.forEach(pod => {
        dependencies.push({
          type: 'mount',
          resourceType: 'Pod',
          resourceName: pod.metadata?.name || 'unknown',
          namespace: pod.metadata?.namespace,
          description: 'Pod will lose access to secret data',
          severity: 'error'
        });
      });

      // Check for service accounts using this secret
      const usingServiceAccounts = relatedResources.filter(resource =>
        resource.kind === 'ServiceAccount' &&
        this.isSecretUsedInServiceAccount(secret, resource)
      );

      usingServiceAccounts.forEach(sa => {
        dependencies.push({
          type: 'reference',
          resourceType: 'ServiceAccount',
          resourceName: sa.metadata?.name || 'unknown',
          namespace: sa.metadata?.namespace,
          description: 'Service account will lose authentication credentials',
          severity: 'error'
        });
      });

      // Check for ingress using TLS secrets
      if (secret.type === 'kubernetes.io/tls') {
        const usingIngress = relatedResources.filter(resource =>
          resource.kind === 'Ingress' &&
          this.isTLSSecretUsedInIngress(secret, resource)
        );

        usingIngress.forEach(ingress => {
          dependencies.push({
            type: 'reference',
            resourceType: 'Ingress',
            resourceName: ingress.metadata?.name || 'unknown',
            namespace: ingress.metadata?.namespace,
            description: 'Ingress will lose TLS certificate',
            severity: 'error'
          });
        });
      }
    }

    return dependencies;
  }

  /**
   * Analyze dependencies for a PVC
   */
  static analyzePVCDependencies(
    pvc: PersistentVolumeClaimResource,
    relatedResources?: any[]
  ): ResourceDependency[] {
    const dependencies: ResourceDependency[] = [];

    if (relatedResources) {
      // Check for pods using this PVC
      const mountingPods = relatedResources.filter(resource =>
        resource.kind === 'Pod' &&
        this.isPVCMountedInPod(pvc, resource)
      );

      mountingPods.forEach(pod => {
        dependencies.push({
          type: 'mount',
          resourceType: 'Pod',
          resourceName: pod.metadata?.name || 'unknown',
          namespace: pod.metadata?.namespace,
          description: 'Pod will lose access to persistent storage',
          severity: 'error'
        });
      });

      // Check for StatefulSets using this PVC
      const usingStatefulSets = relatedResources.filter(resource =>
        resource.kind === 'StatefulSet' &&
        this.isPVCUsedInStatefulSet(pvc, resource)
      );

      usingStatefulSets.forEach(sts => {
        dependencies.push({
          type: 'reference',
          resourceType: 'StatefulSet',
          resourceName: sts.metadata?.name || 'unknown',
          namespace: sts.metadata?.namespace,
          description: 'StatefulSet pods will lose persistent storage',
          severity: 'error'
        });
      });
    }

    // Check if PVC is bound - this is critical information
    if (pvc.status?.phase === 'Bound') {
      dependencies.push({
        type: 'reference',
        resourceType: 'PersistentVolume',
        resourceName: pvc.spec?.volumeName || 'unknown',
        description: 'Bound persistent volume may be released and data could be lost',
        severity: 'warning'
      });
    }

    return dependencies;
  }

  /**
   * Analyze dependencies for a Service
   */
  static analyzeServiceDependencies(
    service: ServiceResource,
    relatedResources?: any[]
  ): ResourceDependency[] {
    const dependencies: ResourceDependency[] = [];

    if (relatedResources) {
      // Check for ingress using this service
      const usingIngress = relatedResources.filter(resource =>
        resource.kind === 'Ingress' &&
        this.isServiceUsedInIngress(service, resource)
      );

      usingIngress.forEach(ingress => {
        dependencies.push({
          type: 'reference',
          resourceType: 'Ingress',
          resourceName: ingress.metadata?.name || 'unknown',
          namespace: ingress.metadata?.namespace,
          description: 'Ingress will lose backend service',
          severity: 'warning'
        });
      });

      // Check for pods selected by this service
      if (service.spec?.selector) {
        const selectedPods = relatedResources.filter(resource =>
          resource.kind === 'Pod' &&
          this.isPodSelectedByService(service, resource)
        );

        if (selectedPods.length > 0) {
          dependencies.push({
            type: 'selector',
            resourceType: 'Pod',
            resourceName: `${selectedPods.length} pod(s)`,
            namespace: service.objectMeta?.namespace,
            description: 'Pods will lose network access through this service',
            severity: 'info'
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Analyze dependencies for an Ingress
   */
  static analyzeIngressDependencies(
    ingress: IngressResource,
    relatedResources?: any[]
  ): ResourceDependency[] {
    const dependencies: ResourceDependency[] = [];

    // Check for services referenced in ingress rules
    if (ingress.spec?.rules) {
      ingress.spec.rules.forEach(rule => {
        rule.http?.paths?.forEach(path => {
          if (path.backend?.service) {
            dependencies.push({
              type: 'reference',
              resourceType: 'Service',
              resourceName: path.backend.service.name,
              namespace: ingress.objectMeta?.namespace,
              description: 'Referenced service provides backend for ingress traffic',
              severity: 'info'
            });
          }
        });
      });
    }

    // Check for TLS secrets
    if (ingress.spec?.tls) {
      ingress.spec.tls.forEach(tls => {
        if (tls.secretName) {
          dependencies.push({
            type: 'reference',
            resourceType: 'Secret',
            resourceName: tls.secretName,
            namespace: ingress.objectMeta?.namespace,
            description: 'TLS secret provides SSL certificate for ingress',
            severity: 'info'
          });
        }
      });
    }

    return dependencies;
  }

  /**
   * Analyze cascading deletions for workload resources
   */
  static analyzeCascadingDeletions(
    resourceType: string,
    resourceName: string,
    namespace: string,
    relatedResources?: any[]
  ): ResourceDependency[] {
    const cascading: ResourceDependency[] = [];

    if (!relatedResources) return cascading;

    switch (resourceType.toLowerCase()) {
      case 'deployment':
        // Deployment will cascade delete ReplicaSets and Pods
        const replicaSets = relatedResources.filter(resource =>
          resource.kind === 'ReplicaSet' &&
          resource.metadata?.ownerReferences?.some((ref: any) =>
            ref.kind === 'Deployment' && ref.name === resourceName
          )
        );

        replicaSets.forEach(rs => {
          cascading.push({
            type: 'ownership',
            resourceType: 'ReplicaSet',
            resourceName: rs.metadata?.name || 'unknown',
            namespace: rs.metadata?.namespace,
            description: 'Owned by deployment, will be automatically deleted',
            severity: 'info'
          });
        });

        const pods = relatedResources.filter(resource =>
          resource.kind === 'Pod' &&
          resource.metadata?.ownerReferences?.some((ref: any) =>
            ref.kind === 'ReplicaSet' &&
            replicaSets.some(rs => rs.metadata?.name === ref.name)
          )
        );

        if (pods.length > 0) {
          cascading.push({
            type: 'ownership',
            resourceType: 'Pod',
            resourceName: `${pods.length} pod(s)`,
            namespace,
            description: 'Owned by deployment ReplicaSets, will be automatically deleted',
            severity: 'info'
          });
        }
        break;

      case 'statefulset':
        // StatefulSet will cascade delete Pods
        const stsPods = relatedResources.filter(resource =>
          resource.kind === 'Pod' &&
          resource.metadata?.ownerReferences?.some((ref: any) =>
            ref.kind === 'StatefulSet' && ref.name === resourceName
          )
        );

        if (stsPods.length > 0) {
          cascading.push({
            type: 'ownership',
            resourceType: 'Pod',
            resourceName: `${stsPods.length} pod(s)`,
            namespace,
            description: 'Owned by StatefulSet, will be automatically deleted',
            severity: 'info'
          });
        }
        break;

      case 'daemonset':
        // DaemonSet will cascade delete Pods
        const dsPods = relatedResources.filter(resource =>
          resource.kind === 'Pod' &&
          resource.metadata?.ownerReferences?.some((ref: any) =>
            ref.kind === 'DaemonSet' && ref.name === resourceName
          )
        );

        if (dsPods.length > 0) {
          cascading.push({
            type: 'ownership',
            resourceType: 'Pod',
            resourceName: `${dsPods.length} pod(s)`,
            namespace,
            description: 'Owned by DaemonSet, will be automatically deleted',
            severity: 'info'
          });
        }
        break;
    }

    return cascading;
  }

  // Helper methods for checking resource relationships
  private static isConfigMapMountedInPod(configMap: ConfigMapResource, pod: any): boolean {
    const volumes = pod.spec?.volumes || [];
    return volumes.some((volume: any) =>
      volume.configMap?.name === configMap.objectMeta?.name
    );
  }

  private static isConfigMapUsedInDeployment(configMap: ConfigMapResource, deployment: any): boolean {
    const containers = deployment.spec?.template?.spec?.containers || [];
    return containers.some((container: any) => {
      const envFrom = container.envFrom || [];
      const env = container.env || [];
      
      return envFrom.some((envFromSource: any) =>
        envFromSource.configMapRef?.name === configMap.objectMeta?.name
      ) || env.some((envVar: any) =>
        envVar.valueFrom?.configMapKeyRef?.name === configMap.objectMeta?.name
      );
    });
  }

  private static isSecretUsedInPod(secret: SecretResource, pod: any): boolean {
    const volumes = pod.spec?.volumes || [];
    const containers = pod.spec?.containers || [];
    
    const volumeUsage = volumes.some((volume: any) =>
      volume.secret?.secretName === secret.objectMeta?.name
    );

    const envUsage = containers.some((container: any) => {
      const envFrom = container.envFrom || [];
      const env = container.env || [];
      
      return envFrom.some((envFromSource: any) =>
        envFromSource.secretRef?.name === secret.objectMeta?.name
      ) || env.some((envVar: any) =>
        envVar.valueFrom?.secretKeyRef?.name === secret.objectMeta?.name
      );
    });

    return volumeUsage || envUsage;
  }

  private static isSecretUsedInServiceAccount(secret: SecretResource, serviceAccount: any): boolean {
    const secrets = serviceAccount.secrets || [];
    const imagePullSecrets = serviceAccount.imagePullSecrets || [];
    
    return secrets.some((secretRef: any) => secretRef.name === secret.objectMeta?.name) ||
           imagePullSecrets.some((secretRef: any) => secretRef.name === secret.objectMeta?.name);
  }

  private static isTLSSecretUsedInIngress(secret: SecretResource, ingress: any): boolean {
    const tls = ingress.spec?.tls || [];
    return tls.some((tlsConfig: any) => tlsConfig.secretName === secret.objectMeta?.name);
  }

  private static isPVCMountedInPod(pvc: PersistentVolumeClaimResource, pod: any): boolean {
    const volumes = pod.spec?.volumes || [];
    return volumes.some((volume: any) =>
      volume.persistentVolumeClaim?.claimName === pvc.objectMeta?.name
    );
  }

  private static isPVCUsedInStatefulSet(pvc: PersistentVolumeClaimResource, statefulSet: any): boolean {
    const volumeClaimTemplates = statefulSet.spec?.volumeClaimTemplates || [];
    return volumeClaimTemplates.some((template: any) =>
      template.metadata?.name === pvc.objectMeta?.name
    );
  }

  private static isServiceUsedInIngress(service: ServiceResource, ingress: any): boolean {
    const rules = ingress.spec?.rules || [];
    return rules.some((rule: any) =>
      rule.http?.paths?.some((path: any) =>
        path.backend?.service?.name === service.objectMeta?.name
      )
    );
  }

  private static isPodSelectedByService(service: ServiceResource, pod: any): boolean {
    const selector = service.spec?.selector;
    if (!selector) return false;

    const podLabels = pod.metadata?.labels || {};
    return Object.entries(selector).every(([key, value]) =>
      podLabels[key] === value
    );
  }
}

/**
 * Get dependencies for any resource type
 */
export function getResourceDependencies(
  resourceType: string,
  resource: any,
  relatedResources?: any[]
): ResourceDependency[] {
  switch (resourceType.toLowerCase()) {
    case 'configmap':
      return ResourceDependencyAnalyzer.analyzeConfigMapDependencies(resource, relatedResources);
    case 'secret':
      return ResourceDependencyAnalyzer.analyzeSecretDependencies(resource, relatedResources);
    case 'persistentvolumeclaim':
    case 'pvc':
      return ResourceDependencyAnalyzer.analyzePVCDependencies(resource, relatedResources);
    case 'service':
      return ResourceDependencyAnalyzer.analyzeServiceDependencies(resource, relatedResources);
    case 'ingress':
      return ResourceDependencyAnalyzer.analyzeIngressDependencies(resource, relatedResources);
    default:
      return [];
  }
}

/**
 * Get cascading deletions for any resource type
 */
export function getCascadingDeletions(
  resourceType: string,
  resourceName: string,
  namespace: string,
  relatedResources?: any[]
): ResourceDependency[] {
  return ResourceDependencyAnalyzer.analyzeCascadingDeletions(
    resourceType,
    resourceName,
    namespace,
    relatedResources
  );
}