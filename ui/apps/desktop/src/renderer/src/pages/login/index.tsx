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

import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@desktop/components/DesktopAuthProvider'
import { Spin } from 'antd'

// Import the original login page component
import OriginalLoginPage from '@dashboard/pages/login'

const LoginPage = (): React.JSX.Element => {
  const { authenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect to overview if already authenticated
  useEffect(() => {
    if (!isLoading && authenticated) {
      console.log('[LoginPage] Already authenticated, redirecting to /overview')
      navigate('/overview', { replace: true })
    }
  }, [authenticated, isLoading, navigate])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FAFBFC]">
        <Spin size="large" />
      </div>
    )
  }

  // If authenticated, redirect
  if (authenticated) {
    return <Navigate to="/overview" replace />
  }

  // Show original login page
  return <OriginalLoginPage />
}

export default LoginPage
