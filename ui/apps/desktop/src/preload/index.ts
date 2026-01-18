import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Store API for persistent configuration
const storeApi = {
  // Get all config (apiEndpoint, token)
  getConfig: (): Promise<{ apiEndpoint: string; token: string }> =>
    ipcRenderer.invoke('store:get-config'),

  // Set config (apiEndpoint and/or token)
  setConfig: (config: { apiEndpoint?: string; token?: string }): Promise<boolean> =>
    ipcRenderer.invoke('store:set-config', config),

  // Get token only
  getToken: (): Promise<string> =>
    ipcRenderer.invoke('store:get-token'),

  // Set token only
  setToken: (token: string): Promise<boolean> =>
    ipcRenderer.invoke('store:set-token', token),

  // Get API endpoint
  getApiEndpoint: (): Promise<string> =>
    ipcRenderer.invoke('store:get-api-endpoint'),

  // Set API endpoint
  setApiEndpoint: (endpoint: string): Promise<boolean> =>
    ipcRenderer.invoke('store:set-api-endpoint', endpoint)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('storeApi', storeApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.storeApi = storeApi
}
