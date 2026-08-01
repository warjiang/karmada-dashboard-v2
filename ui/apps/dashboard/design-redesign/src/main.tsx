import '@/styles/globals.css';

import kubernetesLogoUrl from '../static-pages/kubernetes-logo.svg?url';
import logoUrl from '../static-pages/logo.svg?url';

window.KD_ASSETS = { logo: logoUrl, kubernetesLogo: kubernetesLogoUrl };

await import('@/entries/shadcn-bridge');
await import('@/entries/shadcn-selects');
await import('@/entries/shadcn-inputs');
await import('@/entries/yaml-editor');
await import('../static-pages/mock-data.js');
await import('../static-pages/refresh-interaction.js');

if (document.body.dataset.page === 'create') {
  await import('@/entries/create-shadcn-controls');
  await import('@/entries/create-associated-policies');
}

if (document.body.dataset.page === 'settings') {
  await import('@/entries/dashboard-config-data');
}

if (document.body.dataset.page === 'topology') {
  await import('@/entries/global-topology');
}

if (document.body.dataset.page === 'metrics') {
  await import('@/entries/metrics-dashboard');
}

if (document.body.dataset.page === 'clusters') {
  await import('@/entries/cluster-management-workspace');
}

if (document.body.dataset.page === 'member') {
  await import('../static-pages/member-metrics.js');
  await import('../static-pages/member-detail.js');
}

await import('../static-pages/app.js');

if (document.body.dataset.page === 'settings') {
  await import('@/entries/karmada-config-workspace');
  await import('@/entries/official-configuration-workspaces');
  await import('@/entries/dashboard-config-workspace');
  await import('@/entries/addons-workspace');
}

if (document.body.dataset.page === 'resources') {
  await import('@/entries/control-columns');
}
