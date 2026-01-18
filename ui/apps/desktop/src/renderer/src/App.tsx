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

import { useState, useEffect } from 'react'
import '@/App.css'
import Router from './routes'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { ConfigProvider, App as AntdApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DesktopAuthProvider from './components/DesktopAuthProvider'
import SettingsModal from './components/SettingsModal'
import { getAntdLocale } from '@/utils/i18n'
import { Settings } from 'lucide-react'

const queryClient = new QueryClient()

// Global settings button component
function GlobalSettingsButton({ onClick }: { onClick: () => void }): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
      title="设置"
    >
      <Settings size={24} />
    </button>
  )
}

function App(): React.JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Initialize API endpoint from store on startup
  useEffect(() => {
    const initApiEndpoint = async (): Promise<void> => {
      try {
        const endpoint = await window.storeApi.getApiEndpoint()
        if (endpoint) {
          // Store the endpoint for later use in services
          localStorage.setItem('api-endpoint', endpoint)
        }
      } catch (error) {
        console.error('Failed to get API endpoint:', error)
      }
    }
    initApiEndpoint()
  }, [])

  return (
    <ConfigProvider
      locale={getAntdLocale()}
      theme={{
        components: {
          Layout: {
            siderBg: '#ffffff'
          }
        }
      }}
    >
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <DesktopAuthProvider>
            <HelmetProvider>
              <Helmet>
                <title>Karmada Dashboard</title>
              </Helmet>
              <Router />
              <GlobalSettingsButton onClick={() => setSettingsOpen(true)} />
              <SettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
              />
            </HelmetProvider>
          </DesktopAuthProvider>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
