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

import { create } from 'zustand';
import { ConfigKind } from '@/services/base.ts';

// Enhanced filter state to support all config resource types
export interface FilterState {
  kind: ConfigKind;
  selectedWorkspace: string;
  searchText: string;
  // Enhanced filtering options
  selectedLabels?: string[];
  selectedStatus?: string[];
  sortBy?: string[];
  page?: number;
  itemsPerPage?: number;
}

export interface EditorState {
  show: boolean;
  mode: 'create' | 'edit' | 'read';
  content: string;
}

type State = {
  filter: FilterState;
  editor: EditorState;
};

type Actions = {
  setFilter: (k: Partial<FilterState>) => void;
  viewConfig: (config: string) => void;
  editConfig: (config: string) => void;
  hideEditor: () => void;
  createConfig: () => void;
  // Enhanced actions
  resetFilter: () => void;
  updatePagination: (page: number, itemsPerPage: number) => void;
};

export type Store = State & Actions;

// Default filter state with enhanced options
const defaultFilter: FilterState = {
  kind: ConfigKind.ConfigMap,
  selectedWorkspace: '',
  searchText: '',
  selectedLabels: [],
  selectedStatus: [],
  sortBy: [],
  page: 1,
  itemsPerPage: 20,
};

export const useStore = create<Store>((set) => ({
  filter: defaultFilter,
  editor: {
    show: false,
    mode: 'create',
    content: '',
  },
  
  setFilter: (k: Partial<FilterState>) => {
    set((state) => {
      const f = state.filter;
      return {
        filter: {
          ...f,
          ...k,
          // Reset page when changing filters (except pagination changes)
          page: k.page !== undefined ? k.page : (k.kind !== undefined || k.searchText !== undefined || k.selectedWorkspace !== undefined) ? 1 : f.page,
        },
      };
    });
  },
  
  resetFilter: () => {
    set({ filter: { ...defaultFilter } });
  },
  
  updatePagination: (page: number, itemsPerPage: number) => {
    set((state) => ({
      filter: {
        ...state.filter,
        page,
        itemsPerPage,
      },
    }));
  },
  
  viewConfig: (config: string) => {
    set({
      editor: {
        show: true,
        mode: 'read',
        content: config,
      },
    });
  },
  
  editConfig: (config: string) => {
    set({
      editor: {
        show: true,
        mode: 'edit',
        content: config,
      },
    });
  },
  
  hideEditor: () => {
    set({
      editor: {
        show: false,
        mode: 'edit',
        content: '',
      },
    });
  },
  
  createConfig: () => {
    set({
      editor: {
        show: true,
        mode: 'create',
        content: '',
      },
    });
  },
}));
