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

import { createHashRouter, RouterProvider } from 'react-router-dom'
import { routes } from '@/routes/route'

// Electron 需要使用 HashRouter，因为 file:// 协议不支持 history API
// Use HashRouter for Electron since file:// protocol doesn't support history API
const router = createHashRouter(routes)

export default function Router(): React.JSX.Element {
    return <RouterProvider router={router} />
}
