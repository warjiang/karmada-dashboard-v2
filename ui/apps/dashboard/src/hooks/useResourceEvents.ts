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

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { IResponse, ResourceEvent, EventSeverity, ResourceListResponse } from '../services/base';

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
}

// Event filter options
export interface EventFilter {
  severity: EventSeverity[];
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
  searchText: string;
  resourceTypes: string[];
  reasons: string[];
}

// Event statistics
export interface EventStats {
  total: number;
  normal: number;
  warning: number;
  error: number;
  recentCount: number; // Events in last hour
  criticalCount: number; // Error events in last hour
}

// Resource events query hook
export function useResourceEvents(
  params: EventQueryParams,
  fetchFunction: (params: EventQueryParams) => Promise<IResponse<ResourceListResponse<ResourceEvent>>>,
  options?: Partial<UseQueryOptions<IResponse<ResourceListResponse<ResourceEvent>>>>
) {
  const { memberClusterName, namespace, name, resourceType } = params;

  return useQuery({
    queryKey: [
      memberClusterName,
      'events',
      resourceType,
      namespace,
      name,
      params.eventType,
      params.timeRange,
      params.keyword,
      params.limit,
    ],
    queryFn: () => fetchFunction(params),
    enabled: !!memberClusterName,
    staleTime: 10000, // 10 seconds for events (more frequent updates)
    refetchInterval: 30000, // 30 seconds for events
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  });
}

// Cluster-wide events query hook
export function useClusterEvents(
  memberClusterName: string,
  filter: Partial<EventFilter> = {},
  fetchFunction: (params: EventQueryParams) => Promise<IResponse<ResourceListResponse<ResourceEvent>>>,
  options?: Partial<UseQueryOptions<IResponse<ResourceListResponse<ResourceEvent>>>>
) {
  const queryParams: EventQueryParams = {
    memberClusterName,
    eventType: filter.severity?.[0],
    timeRange: filter.timeRange?.start && filter.timeRange?.end 
      ? {
          start: filter.timeRange.start.toISOString(),
          end: filter.timeRange.end.toISOString(),
        }
      : undefined,
    keyword: filter.searchText,
    limit: 100,
  };

  return useQuery({
    queryKey: [
      memberClusterName,
      'events',
      'cluster',
      filter.severity,
      filter.timeRange,
      filter.searchText,
      filter.resourceTypes,
      filter.reasons,
    ],
    queryFn: () => fetchFunction(queryParams),
    enabled: !!memberClusterName,
    staleTime: 15000, // 15 seconds for cluster events
    refetchInterval: 45000, // 45 seconds for cluster events
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  });
}

// Event filtering and search hook
export function useEventFilter(events: ResourceEvent[] = []) {
  const [filter, setFilter] = useState<EventFilter>({
    severity: [],
    timeRange: { start: null, end: null },
    searchText: '',
    resourceTypes: [],
    reasons: [],
  });

  // Filter events based on current filter settings
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Severity filter
      if (filter.severity.length > 0 && !filter.severity.includes(event.severity || EventSeverity.Normal)) {
        return false;
      }

      // Time range filter
      if (filter.timeRange.start && filter.timeRange.end) {
        const eventTime = new Date(event.lastSeen);
        if (eventTime < filter.timeRange.start || eventTime > filter.timeRange.end) {
          return false;
        }
      }

      // Search text filter
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const searchableText = [
          event.message,
          event.reason,
          event.objectName,
          event.objectNamespace,
          event.sourceComponent,
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      // Resource type filter
      if (filter.resourceTypes.length > 0 && !filter.resourceTypes.includes(event.objectKind)) {
        return false;
      }

      // Reason filter
      if (filter.reasons.length > 0 && !filter.reasons.includes(event.reason)) {
        return false;
      }

      return true;
    });
  }, [events, filter]);

  // Update filter functions
  const updateFilter = useCallback((updates: Partial<EventFilter>) => {
    setFilter(prev => ({ ...prev, ...updates }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({
      severity: [],
      timeRange: { start: null, end: null },
      searchText: '',
      resourceTypes: [],
      reasons: [],
    });
  }, []);

  // Get unique filter options from events
  const filterOptions = useMemo(() => {
    const resourceTypes = [...new Set(events.map(e => e.objectKind))].filter(Boolean);
    const reasons = [...new Set(events.map(e => e.reason))].filter(Boolean);
    const severities = [EventSeverity.Normal, EventSeverity.Warning, EventSeverity.Error];

    return {
      resourceTypes: resourceTypes.map(type => ({ label: type, value: type })),
      reasons: reasons.map(reason => ({ label: reason, value: reason })),
      severities: severities.map(severity => ({ label: severity, value: severity })),
    };
  }, [events]);

  return {
    filter,
    filteredEvents,
    updateFilter,
    clearFilter,
    filterOptions,
    hasActiveFilters: filter.severity.length > 0 || 
                     filter.timeRange.start !== null || 
                     filter.searchText !== '' || 
                     filter.resourceTypes.length > 0 || 
                     filter.reasons.length > 0,
  };
}

// Event statistics hook
export function useEventStats(events: ResourceEvent[] = []): EventStats {
  return useMemo(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const stats = events.reduce(
      (acc, event) => {
        acc.total++;

        // Count by severity
        switch (event.severity) {
          case EventSeverity.Normal:
            acc.normal++;
            break;
          case EventSeverity.Warning:
            acc.warning++;
            break;
          case EventSeverity.Error:
            acc.error++;
            break;
          default:
            acc.normal++;
        }

        // Count recent events (last hour)
        const eventTime = new Date(event.lastSeen);
        if (eventTime >= oneHourAgo) {
          acc.recentCount++;
          if (event.severity === EventSeverity.Error) {
            acc.criticalCount++;
          }
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
      }
    );

    return stats;
  }, [events]);
}

// Event grouping hook
export function useEventGrouping(events: ResourceEvent[] = []) {
  const [groupBy, setGroupBy] = useState<'resource' | 'reason' | 'severity' | 'time'>('resource');

  const groupedEvents = useMemo(() => {
    const groups: Record<string, ResourceEvent[]> = {};

    events.forEach(event => {
      let groupKey: string;

      switch (groupBy) {
        case 'resource':
          groupKey = `${event.objectKind}/${event.objectNamespace}/${event.objectName}`;
          break;
        case 'reason':
          groupKey = event.reason;
          break;
        case 'severity':
          groupKey = event.severity || EventSeverity.Normal;
          break;
        case 'time': {
          // Group by hour
          const eventTime = new Date(event.lastSeen);
          groupKey = eventTime.toISOString().slice(0, 13) + ':00:00.000Z';
          break;
        }
        default:
          groupKey = 'unknown';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(event);
    });

    // Sort groups by event count (descending)
    const sortedGroups = Object.entries(groups)
      .sort(([, a], [, b]) => b.length - a.length)
      .reduce((acc, [key, value]) => {
        acc[key] = value.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
        return acc;
      }, {} as Record<string, ResourceEvent[]>);

    return sortedGroups;
  }, [events, groupBy]);

  return {
    groupBy,
    setGroupBy,
    groupedEvents,
    groupCount: Object.keys(groupedEvents).length,
  };
}

// Event timeline hook for visualization
export function useEventTimeline(events: ResourceEvent[] = [], intervalMinutes: number = 60) {
  const timelineData = useMemo(() => {
    if (events.length === 0) return [];

    // Find time range
    const times = events.map(e => new Date(e.lastSeen).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Create time buckets
    const intervalMs = intervalMinutes * 60 * 1000;
    const buckets: Array<{
      timestamp: string;
      count: number;
      normal: number;
      warning: number;
      error: number;
      events: ResourceEvent[];
    }> = [];

    for (let time = minTime; time <= maxTime; time += intervalMs) {
      const bucketStart = new Date(time);
      const bucketEnd = new Date(time + intervalMs);
      
      const bucketEvents = events.filter(event => {
        const eventTime = new Date(event.lastSeen);
        return eventTime >= bucketStart && eventTime < bucketEnd;
      });

      const severityCounts = bucketEvents.reduce(
        (acc, event) => {
          switch (event.severity) {
            case EventSeverity.Normal:
              acc.normal++;
              break;
            case EventSeverity.Warning:
              acc.warning++;
              break;
            case EventSeverity.Error:
              acc.error++;
              break;
            default:
              acc.normal++;
          }
          return acc;
        },
        { normal: 0, warning: 0, error: 0 }
      );

      buckets.push({
        timestamp: bucketStart.toISOString(),
        count: bucketEvents.length,
        ...severityCounts,
        events: bucketEvents,
      });
    }

    return buckets;
  }, [events, intervalMinutes]);

  return timelineData;
}

// Event export hook
export function useEventExport() {
  const exportEvents = useCallback((
    events: ResourceEvent[],
    format: 'json' | 'csv' = 'json',
    filename?: string
  ) => {
    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === 'csv') {
      // CSV format
      const headers = [
        'Timestamp',
        'Severity',
        'Resource',
        'Namespace',
        'Name',
        'Reason',
        'Message',
        'Count',
        'Source',
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
      ]);

      content = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
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
  }, []);

  return { exportEvents };
}

// Real-time event streaming hook (for future WebSocket implementation)
export function useEventStream(
  memberClusterName: string,
  options?: {
    enabled?: boolean;
    onEvent?: (event: ResourceEvent) => void;
    onError?: (error: Error) => void;
  }
) {
  const [isConnected, setIsConnected] = useState(false);

  // This would be implemented with WebSocket in a real application
  // For now, it's a placeholder that could be extended
  const connect = useCallback(() => {
    if (!options?.enabled) return;

    // Placeholder for WebSocket connection
    setIsConnected(true);
    
    // Simulate connection
    console.log(`Connecting to event stream for cluster: ${memberClusterName}`);
  }, [memberClusterName, options?.enabled]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    console.log('Disconnected from event stream');
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
  };
}

// Event formatting utilities
export function formatEventAge(timestamp: string): string {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

export function formatEventMessage(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.slice(0, maxLength - 3) + '...';
}