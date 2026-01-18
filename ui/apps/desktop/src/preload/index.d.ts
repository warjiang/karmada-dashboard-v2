import { ElectronAPI } from '@electron-toolkit/preload'

interface StoreApi {
  getConfig: () => Promise<{ apiEndpoint: string; token: string }>
  setConfig: (config: { apiEndpoint?: string; token?: string }) => Promise<boolean>
  getToken: () => Promise<string>
  setToken: (token: string) => Promise<boolean>
  getApiEndpoint: () => Promise<string>
  setApiEndpoint: (endpoint: string) => Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI
    storeApi: StoreApi
  }
}
