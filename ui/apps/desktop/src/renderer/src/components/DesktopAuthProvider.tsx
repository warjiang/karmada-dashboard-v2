import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useCallback,
  useEffect
} from 'react'
import { Me } from '@/services/auth'
import { karmadaClient } from '@/services'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const AuthContext = createContext<{
  authenticated: boolean
  token: string
  setToken: (v: string) => void
  isLoading: boolean
}>({
  authenticated: false,
  token: '',
  setToken: () => {},
  isLoading: true
})

const DesktopAuthProvider = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const [token, setToken_] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const queryClient = useQueryClient()

  // Initialize: Load token from electron-store on startup
  useEffect(() => {
    const initToken = async (): Promise<void> => {
      try {
        // Check if storeApi is available (Electron environment)
        if (typeof window !== 'undefined' && window.storeApi) {
          // First try to get from electron-store
          const storedToken = await window.storeApi.getToken()
          console.log('[DesktopAuth] Token from store:', storedToken ? 'found' : 'not found')

          if (storedToken) {
            // Sync to localStorage for web compatibility
            localStorage.setItem('token', storedToken)
            // Update axios header
            karmadaClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
            setToken_(storedToken)
          } else {
            // Fall back to localStorage
            const localToken = localStorage.getItem('token')
            if (localToken) {
              console.log('[DesktopAuth] Token from localStorage:', 'found')
              // Sync to electron-store
              await window.storeApi.setToken(localToken)
              karmadaClient.defaults.headers.common['Authorization'] = `Bearer ${localToken}`
              setToken_(localToken)
            }
          }
        } else {
          // Not in Electron, use localStorage only
          console.log('[DesktopAuth] storeApi not available, using localStorage')
          const localToken = localStorage.getItem('token')
          if (localToken) {
            karmadaClient.defaults.headers.common['Authorization'] = `Bearer ${localToken}`
            setToken_(localToken)
          }
        }
      } catch (error) {
        console.error('[DesktopAuth] Failed to initialize token:', error)
        // Fall back to localStorage only
        const localToken = localStorage.getItem('token')
        if (localToken) {
          karmadaClient.defaults.headers.common['Authorization'] = `Bearer ${localToken}`
          setToken_(localToken)
        }
      } finally {
        setIsInitialized(true)
      }
    }

    initToken()
  }, [])

  const setToken = useCallback(
    async (newToken: string) => {
      console.log('[DesktopAuth] Setting new token')
      // Save to localStorage
      localStorage.setItem('token', newToken)

      // Save to electron-store
      try {
        if (window.storeApi) {
          await window.storeApi.setToken(newToken)
          console.log('[DesktopAuth] Token saved to store')
        }
      } catch (error) {
        console.error('[DesktopAuth] Failed to save token to store:', error)
      }

      // Update axios header immediately
      karmadaClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

      // Update state - this will trigger a re-render and the query will refetch
      setToken_(newToken)

      // Invalidate and refetch the Me query to update authentication state
      await queryClient.invalidateQueries({ queryKey: ['Me'] })
    },
    [queryClient]
  )

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['Me', token],
    queryFn: async () => {
      console.log('[DesktopAuth] Checking auth with token:', token ? 'present' : 'absent')
      if (token) {
        karmadaClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const ret = await Me()
        console.log('[DesktopAuth] Auth check result:', ret.data)
        return ret.data
      } else {
        return {
          authenticated: false
        }
      }
    },
    enabled: isInitialized
  })

  const isLoading = !isInitialized || queryLoading

  const ctxValue = useMemo(() => {
    console.log(
      '[DesktopAuth] Context update - authenticated:',
      !!data?.authenticated,
      'isLoading:',
      isLoading
    )
    if (data && token) {
      return {
        authenticated: !!data.authenticated,
        token,
        setToken,
        isLoading
      }
    } else {
      return {
        authenticated: false,
        token: '',
        setToken,
        isLoading
      }
    }
  }, [data, token, setToken, isLoading])

  // Don't block rendering during loading - just pass the loading state
  // This prevents the navigation from being lost during auth state updates
  return <AuthContext.Provider value={ctxValue}>{children}</AuthContext.Provider>
}

export const useAuth = (): {
  authenticated: boolean
  token: string
  setToken: (v: string) => void
  isLoading: boolean
} => {
  return useContext(AuthContext)
}

export default DesktopAuthProvider
