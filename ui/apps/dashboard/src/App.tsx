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

import { ClusterContext } from "@/hooks";
import { useState } from "react";
import "./App.css";
import Router from "./routes";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { ConfigProvider, App as AntdApp, ThemeConfig } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthProvider from "@/components/auth";
import { getAntdLocale } from "@/utils/i18n.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid repeated refetches on window focus/reconnect which can
      // cause duplicate error notifications and unnecessary traffic.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Limit automatic retries; many API errors here are permission-related
      // (e.g. 403) and won't succeed by retrying.
      retry: 1,
    },
  },
});

// Unified theme configuration for Ant Design
const themeConfig: ThemeConfig = {
  token: {
    // Primary color - blue
    colorPrimary: '#2563eb',
    colorPrimaryHover: '#1d4ed8',
    colorPrimaryActive: '#1e40af',
    
    // Border radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    
    // Font
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontSize: 14,
    
    // Colors
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    
    // Text colors
    colorText: '#111827',
    colorTextSecondary: '#4b5563',
    colorTextTertiary: '#9ca3af',
    
    // Background colors
    colorBgContainer: '#ffffff',
    colorBgLayout: '#fafbfc',
    
    // Border colors
    colorBorder: '#e5e7eb',
    colorBorderSecondary: '#f3f4f6',
    
    // Control height
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
      bodyBg: '#fafbfc',
      footerBg: '#fafbfc',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#eff6ff',
      itemSelectedColor: '#2563eb',
      itemHoverBg: '#eff6ff',
      itemHoverColor: '#2563eb',
      itemActiveBg: '#eff6ff',
      subMenuItemBg: 'transparent',
      groupTitleColor: '#6b7280',
      itemColor: '#374151',
    },
    Card: {
      borderRadiusLG: 8,
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    },
    Button: {
      borderRadius: 6,
      defaultBg: '#ffffff',
      defaultBorderColor: '#d1d5db',
      defaultColor: '#374151',
      primaryShadow: '0 1px 2px rgba(37, 99, 235, 0.1)',
    },
    Table: {
      headerBg: '#f9fafb',
      headerColor: '#374151',
      headerBorderRadius: 8,
      rowHoverBg: '#eff6ff',
      rowSelectedBg: '#eff6ff',
      borderColor: '#e5e7eb',
      cellPaddingBlock: 8,
      cellPaddingInline: 16,
      headerSplitColor: '#e5e7eb',
      fontSize: 14,
      fontSizeSM: 13,
      fontSizeLG: 14,
    },
    Input: {
      borderRadius: 6,
      hoverBorderColor: '#60a5fa',
      activeBorderColor: '#3b82f6',
    },
    Select: {
      borderRadius: 6,
      optionSelectedBg: '#eff6ff',
      optionActiveBg: '#eff6ff',
    },
    Modal: {
      borderRadiusLG: 12,
      titleFontSize: 18,
    },
    Drawer: {
      borderRadiusLG: 8,
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Badge: {
      statusSize: 8,
    },
    Tooltip: {
      borderRadius: 6,
    },
    Popover: {
      borderRadiusLG: 8,
    },
    Dropdown: {
      borderRadiusLG: 8,
    },
    Tabs: {
      inkBarColor: '#2563eb',
      itemSelectedColor: '#2563eb',
      itemHoverColor: '#2563eb',
    },
    Pagination: {
      borderRadius: 6,
    },
    Alert: {
      borderRadiusLG: 8,
    },
    Collapse: {
      borderRadiusLG: 8,
    },
    Steps: {
      colorPrimary: '#2563eb',
    },
    Progress: {
      defaultColor: '#2563eb',
    },
    Switch: {
      colorPrimary: '#2563eb',
    },
    Radio: {
      colorPrimary: '#2563eb',
    },
    Checkbox: {
      colorPrimary: '#2563eb',
    },
    DatePicker: {
      borderRadius: 6,
    },
    Breadcrumb: {
      itemColor: '#6b7280',
      linkColor: '#2563eb',
      linkHoverColor: '#1d4ed8',
      separatorColor: '#d1d5db',
    },
  },
};

function App() {
  const [cluster, setCluster] = useState<string>("");
  return (
    <ConfigProvider
      locale={getAntdLocale()}
      theme={themeConfig}
    >
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <ClusterContext.Provider value={{
            currentCluster: cluster,
            setCurrentCluster: setCluster,
          }}>
            <AuthProvider>
              <HelmetProvider>
                <Helmet>
                  <title>Karmada Dashboard</title>
                  <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href="/apple-touch-icon.png"
                  />

                  <link
                    rel="icon"
                    type="image/png"
                    sizes="16x16"
                    href="/favicon-16x16.png"
                  />

                  <link
                    rel="icon"
                    type="image/png"
                    sizes="32x32"
                    href="/favicon-32x32.png"
                  />

                  <link
                    rel="shortcut icon"
                    type="image/x-icon"
                    href="/favicon.ico"
                  />
                </Helmet>
                <Router />
              </HelmetProvider>
            </AuthProvider>
          </ClusterContext.Provider>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
