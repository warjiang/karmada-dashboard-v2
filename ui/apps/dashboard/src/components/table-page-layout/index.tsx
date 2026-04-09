/*
Copyright 2026 The Karmada Authors.

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

import { ReactNode } from 'react';

interface TablePageLayoutProps {
  filterBar?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function TablePageLayout({ filterBar, children, className }: TablePageLayoutProps) {
  return (
    <div className={`h-full w-full flex flex-col bg-[var(--kd-bg-secondary)] ${className || ''}`}>
      {filterBar && (
        <div className="pb-3">
          <div className="bg-white rounded-lg border border-[var(--kd-border-light)] shadow-sm px-4 py-3">
            {filterBar}
          </div>
        </div>
      )}
      <div className="flex-1">
        <div className="bg-white rounded-lg border border-[var(--kd-border-light)] shadow-sm h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
