import { createRoot } from "react-dom/client"

import { KarmadaConfigWorkspace } from "@/components/karmada-config-workspace"

document.querySelectorAll<HTMLElement>("[data-shadcn-karmada-config-root]").forEach((element) => {
  createRoot(element).render(<KarmadaConfigWorkspace />)
})
