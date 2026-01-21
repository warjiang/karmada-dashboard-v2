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

import React from 'react';
import EventViewer from '../EventViewer';
import { GetResourceEvents } from '@/services/member-cluster/events';
import { DetailTabProps } from './index';

// Enhanced Events tab component for ResourceDetail
export const EventsTab: React.FC<DetailTabProps> = ({ 
  memberClusterName, 
  resourceType, 
  resource 
}) => {
  return (
    <EventViewer
      memberClusterName={memberClusterName}
      namespace={resource?.objectMeta?.namespace}
      name={resource?.objectMeta?.name}
      resourceType={resourceType}
      fetchFunction={async (params) => {
        const response = await GetResourceEvents({
          memberClusterName: params.memberClusterName,
          namespace: params.namespace!,
          name: params.name!,
          resourceType: params.resourceType!,
          limit: 100,
        });
        return {
          events: response.events || [],
          listMeta: response.listMeta || { totalItems: 0 },
        };
      }}
      title="Resource Events"
      showStats={true}
      showTimeline={true}
      showGrouping={true}
      showExport={true}
      showFilters={true}
      autoRefresh={true}
      refreshInterval={30000}
      height={600}
    />
  );
};

export default EventsTab;