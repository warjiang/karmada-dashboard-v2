import {
  convertDataSelectQuery,
  DataSelectQuery,
  karmadaMemberClusterClient,
  ObjectMeta,
  TypeMeta,
} from '../base';

export interface PolicyRule {
  verbs: string[];
  resources: string[];
  resourceNames?: string[];
  apiGroups: string[];
}

export interface Role {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  rules: PolicyRule[];
}

export interface RoleBinding {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  subjects: Subject[];
  roleRef: RoleRef;
}

export interface Subject {
  kind: string;
  name: string;
  namespace?: string;
}

export interface RoleRef {
  apiGroup: string;
  kind: string;
  name: string;
}

export interface ClusterRole {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  rules: PolicyRule[];
}

export interface ClusterRoleBinding {
  objectMeta: ObjectMeta;
  typeMeta: TypeMeta;
  subjects: Subject[];
  roleRef: RoleRef;
}
export async function GetMemberClusterRoles(params: {
  memberClusterName: string;
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { memberClusterName, namespace, keyword, ...queryParams } = params;
  const url = namespace
    ? `/clusterapi/${memberClusterName}/api/v1/role/${namespace}`
    : `/clusterapi/${memberClusterName}/api/v1/role`;
  const requestData = { ...queryParams } as DataSelectQuery;
  if (keyword) {
    requestData.filterBy = ['name', keyword];
  }
  const resp = await karmadaMemberClusterClient.get<{
    errors: string[];
    listMeta: {
      totalItems: number;
    };
    items: Role[];
  }>(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetMemberClusterRoleDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await karmadaMemberClusterClient.get<{
    errors: string[];
  } & Role>(`/clusterapi/${memberClusterName}/api/v1/role/${namespace}/${name}`);
  return resp.data;
}
export async function GetMemberClusterRoleBindings(params: {
  memberClusterName: string;
  namespace?: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { memberClusterName, namespace, keyword, ...queryParams } = params;
  const url = namespace
    ? `/clusterapi/${memberClusterName}/api/v1/rolebinding/${namespace}`
    : `/clusterapi/${memberClusterName}/api/v1/rolebinding`;
  const requestData = { ...queryParams } as DataSelectQuery;
  if (keyword) {
    requestData.filterBy = ['name', keyword];
  }
  const resp = await karmadaMemberClusterClient.get<{
    errors: string[];
    listMeta: {
      totalItems: number;
    };
    items: RoleBinding[];
  }>(url, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetMemberClusterRoleBindingDetail(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
}) {
  const { memberClusterName, namespace, name } = params;
  const resp = await karmadaMemberClusterClient.get<{
    errors: string[];
  } & RoleBinding>(`/clusterapi/${memberClusterName}/api/v1/rolebinding/${namespace}/${name}`);
  return resp.data;
}
export async function GetMemberClusterClusterRoles(params: {
  memberClusterName: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { memberClusterName, keyword, ...queryParams } = params;
  const requestData = { ...queryParams } as DataSelectQuery;
  if (keyword) {
    requestData.filterBy = ['name', keyword];
  }
  const resp = await karmadaMemberClusterClient.get<{
    errors: string[];
    listMeta: {
      totalItems: number;
    };
    items: ClusterRole[];
  }>(`/clusterapi/${memberClusterName}/api/v1/clusterrole`, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetMemberClusterClusterRoleDetail(params: {
  memberClusterName: string;
  name: string;
}) {
  const { memberClusterName, name } = params;
  const resp = await karmadaMemberClusterClient.get<{
    errors: string[];
  } & ClusterRole>(`/clusterapi/${memberClusterName}/api/v1/clusterrole/${name}`);
  return resp.data;
}
export async function GetMemberClusterClusterRoleBindings(params: {
  memberClusterName: string;
  keyword?: string;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}) {
  const { memberClusterName, keyword, ...queryParams } = params;
  const requestData = { ...queryParams } as DataSelectQuery;
  if (keyword) {
    requestData.filterBy = ['name', keyword];
  }
  const resp = await karmadaMemberClusterClient.get<{
    errors: string[];
    listMeta: {
      totalItems: number;
    };
    items: ClusterRoleBinding[];
  }>(`/clusterapi/${memberClusterName}/api/v1/clusterrolebinding`, {
    params: convertDataSelectQuery(requestData),
  });
  return resp.data;
}

export async function GetMemberClusterClusterRoleBindingDetail(params: {
  memberClusterName: string;
  name: string;
}) {
  const { memberClusterName, name } = params;
  const resp = await karmadaMemberClusterClient.get<{
    errors: string[];
  } & ClusterRoleBinding>(`/clusterapi/${memberClusterName}/api/v1/clusterrolebinding/${name}`);
  return resp.data;
}