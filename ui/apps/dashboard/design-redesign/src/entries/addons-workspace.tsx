import { createRoot } from "react-dom/client"

import { AddonsWorkspace } from "@/components/addons-workspace"

document.querySelectorAll<HTMLElement>("[data-shadcn-addons-root]").forEach((element) => {
  createRoot(element).render(<AddonsWorkspace clusters={window.KD_MOCK?.clusters ?? []} />)
})
