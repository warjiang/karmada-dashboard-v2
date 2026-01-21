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

import { enhancedMemberClusterClient } from '../base';
import { IResponse, ResourceEvent, EventSeverity, DataSelectQuery, convertDataSelectQuery } from '../base';

// Event query parameters
export interface EventQueryParams {
  memberClusterName: string;
  namespace?: string;
  name?: string;
  resourceType?: string;
  eventType?: EventSeverity;
  timeRange?: {
    start: string;
    end: string;
  };
  keyword?: string;
  limit?: number;
  filterBy?: string[];
  sortBy?: string[];
  itemsPerPage?: number;
  page?: number;
}

// Generic event fetching function for any resource
export async function GetMemberClusterResourceEvents(params: EventQueryParams) {
  const { 
    memberClusterName, 
    namespace, 
    name, 
    resourceType, 
    keyword, 
    eventType,
    timeRange,
    limit,
    ...queryParams 
  } = params;

  // Build URL based on parameters
  let url: string;
  if (name && namespace && resourceType) {
    // Resource-specific events
    url = `/clusterapi/${memberClusterName}/api/v1/${resourceType}/${namespace}/${name}/event`;
  } else if (namespace) {
    // Namespace-scoped events
    url = `/clusterapi/${memberClusterName}/api/v1/event/${namespace}`;
  } else {
    // Cluster-wide events
    url = `/clusterapi/${memberClusterName}/api/v1/event`;
  }

  // Build query parameters
  const requestData = { ...queryParams } as DataSelectQuery;
  
  // Add keyword filter
  if (keyword) {
    requestData.filterBy = requestData.filterBy || [];
    requestData.filterBy.push('message', keyword);
  }

  // Add event type filter
  if (eventType) {
    requestData.filterBy = requestData.filterBy || [];
    requestData.filterBy.push('type', eventType);
  }

  // Add time range filter (if supported by backend)
  if (timeRange) {
    requestData.filterBy = requestData.filterBy || [];
    requestData.filterBy.push('lastSeen', `${timeRange.start},${timeRange.end}`);
  }

  // Add limit
  if (limit) {
    requestData.itemsPerPage = limit;
  }

  // Default sorting by lastSeen descending
  if (!requestData.sortBy) {
    requestData.sortBy = ['d,lastSeen'];
  }

  const resp = await enhancedMemberClusterClient.get<
    IResponse<{
      errors: string[];
      listMeta: {
        totalItems: number;
      };
      events: ResourceEvent[];
    }>
  >(url, {
    params: convertDataSelectQuery(requestData),
  });

  return resp.data;
}

// Get events for a specific resource
export async function GetResourceEvents(params: {
  memberClusterName: string;
  namespace: string;
  name: string;
  resourceType: string;
  limit?: number;
}) {
  const response = await GetMemberClusterResourceEvents({
    ...params,
    sortBy: ['d,lastSeen'], // Sort by lastSeen descending
  });
  
  return {
    events: response.events || [],
    listMeta: response.listMeta || { totalItems: 0 },
    errors: response.errors || [],
  };
}

// Get namespace events
export async function GetNamespaceEvents(params: {
  memberClusterName: string;
  namespace: string;
  keyword?: string;
  eventType?: EventSeverity;
  limit?: number;
}) {
  const response = await GetMemberClusterResourceEvents({
    ...params,
    sortBy: ['d,lastSeen'],
  });
  
  return {
    events: response.events || [],
    listMeta: response.listMeta || { totalItems: 0 },
    errors: response.errors || [],
  };
}

// Get cluster-wide events
export async function GetClusterEvents(params: {
  memberClusterName: string;
  keyword?: string;
  eventType?: EventSeverity;
  timeRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  itemsPerPage?: number;
  page?: number;
}) {
  const response = await GetMemberClusterResourceEvents({
    ...params,
    sortBy: ['d,lastSeen'],
  });
  
  return {
    events: response.events || [],
    listMeta: response.listMeta || { totalItems: 0 },
    errors: response.errors || [],
  };
}

// Get events with advanced filtering
export async function GetFilteredEvents(params: {
  memberClusterName: string;
  namespace?: string;
  resourceTypes?: string[];
  severities?: EventSeverity[];
  reasons?: string[];
  timeRange?: {
    start: string;
    end: string;
  };
  searchText?: string;
  limit?: number;
  itemsPerPage?: number;
  page?: number;
}) {
  const {
    memberClusterName,
    namespace,
    resourceTypes,
    severities,
    reasons,
    timeRange,
    searchText,
    ...queryParams
  } = params;

  const filterBy: string[] = [];

  // Add resource type filters
  if (resourceTypes && resourceTypes.length > 0) {
    resourceTypes.forEach(type => {
      filterBy.push('objectKind', type);
    });
  }

  // Add severity filters
  if (severities && severities.length > 0) {
    severities.forEach(severity => {
      filterBy.push('type', severity);
    });
  }

  // Add reason filters
  if (reasons && reasons.length > 0) {
    reasons.forEach(reason => {
      filterBy.push('reason', reason);
    });
  }

  // Add search text filter
  if (searchText) {
    filterBy.push('message', searchText);
  }

  const response = await GetMemberClusterResourceEvents({
    memberClusterName,
    namespace,
    timeRange,
    filterBy: filterBy.length > 0 ? filterBy : undefined,
    sortBy: ['d,lastSeen'],
    ...queryParams,
  });
  
  return {
    events: response.events || [],
    listMeta: response.listMeta || { totalItems: 0 },
    errors: response.errors || [],
  };
}

// Get event statistics for a resource or namespace
export async function GetEventStats(params: {
  memberClusterName: string;
  namespace?: string;
  name?: string;
  resourceType?: string;
}) {
  const eventsResponse = await GetMemberClusterResourceEvents({
    ...params,
    limit: 1000, // Get more events for accurate stats
  });

  const events = eventsResponse.events || [];
  
  // Calculate statistics
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const stats = events.reduce(
    (acc: any, event: ResourceEvent) => {
      acc.total++;

      // Count by severity
      const severity = event.severity || EventSeverity.Normal;
      switch (severity) {
        case EventSeverity.Normal:
          acc.normal++;
          break;
        case EventSeverity.Warning:
          acc.warning++;
          break;
        case EventSeverity.Error:
          acc.error++;
          break;
      }

      // Count recent events
      const eventTime = new Date(event.lastSeen);
      if (eventTime >= oneHourAgo) {
        acc.recentCount++;
        if (severity === EventSeverity.Error) {
          acc.criticalCount++;
        }
      }

      if (eventTime >= oneDayAgo) {
        acc.dailyCount++;
      }

      return acc;
    },
    {
      total: 0,
      normal: 0,
      warning: 0,
      error: 0,
      recentCount: 0,
      criticalCount: 0,
      dailyCount: 0,
    }
  );

  return {
    ...stats,
    events: events.slice(0, 100), // Return first 100 events for display
    listMeta: eventsResponse.listMeta,
  };
}

// Get unique filter options from events
export async function GetEventFilterOptions(params: {
  memberClusterName: string;
  namespace?: string;
}) {
  const eventsResponse = await GetMemberClusterResourceEvents({
    ...params,
    limit: 1000,
  });

  const events = eventsResponse.events || [];

  // Extract unique values for filters
  const resourceTypes = [...new Set(events.map((e: ResourceEvent) => e.objectKind))].filter(Boolean);
  const reasons = [...new Set(events.map((e: ResourceEvent) => e.reason))].filter(Boolean);
  const severities = [EventSeverity.Normal, EventSeverity.Warning, EventSeverity.Error];
  const namespaces = [...new Set(events.map((e: ResourceEvent) => e.objectNamespace))].filter(Boolean);

  return {
    resourceTypes: resourceTypes.map(type => ({ label: type, value: type })),
    reasons: reasons.map(reason => ({ label: reason, value: reason })),
    severities: severities.map(severity => ({ label: severity, value: severity })),
    namespaces: namespaces.map(ns => ({ label: ns, value: ns })),
  };
}

// Export events in different formats
export function exportEventsData(
  events: ResourceEvent[],
  format: 'json' | 'csv' = 'json',
  filename?: string
): void {
  let content: string;
  let mimeType: string;
  let extension: string;

  if (format === 'csv') {
    // CSV format
    const headers = [
      'Timestamp',
      'Severity',
      'Resource Type',
      'Namespace',
      'Name',
      'Reason',
      'Message',
      'Count',
      'Source Component',
      'Source Host',
    ];

    const rows = events.map(event => [
      event.lastSeen,
      event.severity || EventSeverity.Normal,
      event.objectKind,
      event.objectNamespace,
      event.objectName,
      event.reason,
      event.message.replace(/"/g, '""'), // Escape quotes
      event.count.toString(),
      event.sourceComponent,
      event.sourceHost,
    ]);

    content = [headers, ...rows]
      .map(row => row.map(cell => `"${cell || ''}"`).join(','))
      .join('\n');
    
    mimeType = 'text/csv';
    extension = 'csv';
  } else {
    // JSON format
    content = JSON.stringify(events, null, 2);
    mimeType = 'application/json';
    extension = 'json';
  }

  // Create and download file
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `events-${new Date().toISOString().slice(0, 10)}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Real-time event monitoring (placeholder for WebSocket implementation)
export class EventMonitor {
  private memberClusterName: string;
  private namespace?: string;
  private resourceType?: string;
  private name?: string;
  private onEvent?: (event: ResourceEvent) => void;
  private onError?: (error: Error) => void;
  private intervalId?: NodeJS.Timeout;
  private lastEventTime?: string;

  constructor(params: {
    memberClusterName: string;
    namespace?: string;
    resourceType?: string;
    name?: string;
    onEvent?: (event: ResourceEvent) => void;
    onError?: (error: Error) => void;
  }) {
    this.memberClusterName = params.memberClusterName;
    this.namespace = params.namespace;
    this.resourceType = params.resourceType;
    this.name = params.name;
    this.onEvent = params.onEvent;
    this.onError = params.onError;
  }

  start(intervalMs: number = 5000): void {
    this.stop(); // Stop any existing monitoring

    this.intervalId = setInterval(async () => {
      try {
        const response = await GetMemberClusterResourceEvents({
          memberClusterName: this.memberClusterName,
          namespace: this.namespace,
          resourceType: this.resourceType,
          name: this.name,
          limit: 10,
        });

        const events = response.events || [];
        
        // Filter for new events since last check
        const newEvents = this.lastEventTime
          ? events.filter((event: ResourceEvent) => new Date(event.lastSeen) > new Date(this.lastEventTime!))
          : events;

        // Update last event time
        if (events.length > 0) {
          this.lastEventTime = events[0].lastSeen;
        }

        // Notify about new events
        newEvents.forEach((event: ResourceEvent) => {
          this.onEvent?.(event);
        });

      } catch (error) {
        this.onError?.(error as Error);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}