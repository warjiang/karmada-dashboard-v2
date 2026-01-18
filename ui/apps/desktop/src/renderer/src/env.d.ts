/// <reference types="vite/client" />

interface Window {
    __path_prefix__: string
    __dynamic_base__: string
    MonacoEnvironment?: {
        getWorker: (workerId: string, label: string) => Worker
    }
}
