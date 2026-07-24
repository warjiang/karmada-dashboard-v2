# Direction Approval

## Presented directions

- A · Night Ops — `directions/a-night-ops.png`
- B · Control Canvas — `directions/b-control-canvas.png`
- C · Federation Atlas — `directions/c-federation-atlas.png`

## User decision

> A + 亮色、暗色切换

Approved on 2026-07-24.

## Design system locked for execution

- **Narrative role:** an operations cockpit for reading federation health, risk, and recent change before drilling into resources.
- **Viewing distance:** laptop-first, tuned for dense day-to-day administration rather than presentation-scale viewing.
- **Visual temperature:** calm, technical, and authoritative; alert color is reserved for real operational meaning.
- **Capacity model:** persistent navigation, one dominant work surface, compact context rail, and data tables that remain scannable under realistic density.
- **Visual motif:** the Karmada federation route — control plane, member clusters, and propagation paths form the organizing language instead of generic dashboard cards.
- **Themes:** fully designed light and dark appearances, initialized from the system preference and persisted with `localStorage`.

The form comes directly from Karmada's federation model: resources leave the control plane, travel through policies, and resolve into member-cluster state.
