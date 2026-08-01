import { createRoot } from "react-dom/client"

import { OfficialConfigurationWorkspace } from "@/components/official-configuration-workspaces"

document.querySelectorAll<HTMLElement>("[data-official-config-root]").forEach((element) => {
  const section = element.dataset.officialConfigRoot
  if (section === "upgrade" || section === "failover" || section === "reschedule" || section === "permissions") {
    createRoot(element).render(<OfficialConfigurationWorkspace section={section} />)
  }
})
