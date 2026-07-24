---
name: Karmada Dashboard
description: Operational control surface for multi-cluster Karmada management.
colors:
  primary: "#1890ff"
  text-primary: "#141414"
  text-secondary: "#1f1f1f"
  surface-hover: "#f5f5f5"
  surface-nav: "rgba(255, 255, 255, 0.94)"
  surface-page: "oklch(0.985 0.005 240)"
  surface-brand: "oklch(0.56 0.16 250)"
  text-on-brand: "oklch(0.98 0.01 250)"
  text-on-brand-muted: "oklch(0.94 0.01 250)"
typography:
  body:
    fontFamily: "'Helvetica Neue', Arial, 'Source Han Sans SC', 'San Francisco', 'Microsoft YaHei', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  title:
    fontFamily: "'Helvetica Neue', Arial, 'Source Han Sans SC', 'San Francisco', 'Microsoft YaHei', sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.2px"
  label:
    fontFamily: "'Helvetica Neue', Arial, 'Source Han Sans SC', 'San Francisco', 'Microsoft YaHei', sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "0.2px"
rounded:
  sm: "6px"
  md: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-brand}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-nav}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  nav-user-chip:
    backgroundColor: "{colors.surface-nav}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  login-card-title:
    backgroundColor: "{colors.surface-brand}"
    textColor: "{colors.text-on-brand}"
    rounded: "{rounded.md}"
    padding: "14px 16px 12px"
---

# Design System: Karmada Dashboard

## 1. Overview

**Creative North Star: "Operational Control Deck"**

Karmada Dashboard is a product-first interface for platform engineers and SREs running multi-cluster operations. The system emphasizes quick orientation, low interaction friction, and predictable behavior under pressure.

The visual language is restrained and practical: dense but legible information, familiar control patterns, and selective color emphasis for state and action. The design avoids ornamental treatment and keeps cognitive load low for repeated daily use.

This system explicitly rejects over-decorated marketing aesthetics and noisy legacy-console complexity. Layout and components should reinforce stable operational workflows, not compete with them.

**Key Characteristics:**
- Compact information density with clear hierarchy
- Strong action/state legibility
- Familiar enterprise interaction patterns
- Conservative motion and predictable transitions

## 2. Colors

The palette is neutral-first with one operational accent and high-contrast text roles.

### Primary
- **Control Blue** (`#1890ff`): Primary actions, interactive affordances, and active states where user intent must be unambiguous.

### Neutral
- **Command Ink** (`#141414`): Primary text and high-priority labels.
- **Secondary Ink** (`#1f1f1f`): Supporting text and user identity labels.
- **Hover Mist** (`#f5f5f5`): Hover surfaces for chips and lightweight interactive containers.
- **Translucent Surface** (`rgba(255, 255, 255, 0.94)`): Top navigation background with blur for persistent framing.
- **Console Canvas** (`oklch(0.985 0.005 240)`): Page-level background for low-noise task focus.

### Tertiary
- **Cluster Header Blue** (`oklch(0.56 0.16 250)`): Login header emphasis and branded section tops.
- **Header Foreground High** (`oklch(0.98 0.01 250)`): High-contrast text on brand header surfaces.
- **Header Foreground Soft** (`oklch(0.94 0.01 250)`): Secondary explanatory text on brand header surfaces.

### Named Rules
**The One Accent Rule.** Keep `#1890ff` as the only high-saturation interaction accent on most screens. Additional chroma is reserved for scoped context surfaces.

## 3. Typography

**Display Font:** none (system does not use decorative display type)
**Body Font:** Helvetica Neue, Arial, Source Han Sans SC, San Francisco, Microsoft YaHei, sans-serif
**Label/Mono Font:** same as body stack

**Character:** utilitarian and readable. Typography prioritizes scanning speed in dense operations views over expressive contrast.

### Hierarchy
- **Headline** (500, 24px, 1.35): Section-level headings and page anchors with moderate emphasis.
- **Body** (400, 13px, 1.5): Default app text for navigation and content labels.
- **Label** (500, 12px, 1.33, 0.2px): Compact labels and identity chips.

### Named Rules
**The Operator Readability Rule.** Prefer stable, familiar sizes in the 12px to 24px range; avoid dramatic type scaling that reduces scan consistency.

## 4. Elevation

The system uses minimal, structural elevation. Most surfaces remain visually flat; depth appears mainly in persistent framing elements and state feedback.

### Shadow Vocabulary
- **Frame Lift** (`0 2px 4px rgba(27, 31, 35, 0.08)`): Fixed top navigation separation from scrolling content.

### Named Rules
**The Flat-by-Default Rule.** Default task surfaces should not float. Introduce elevation only to clarify structure or persistent context.

## 5. Components

### Buttons
- **Shape:** Soft-rectangular (`8px` radius in current login flow)
- **Primary:** `#1890ff` background with light foreground text; used for submit and confirm actions.
- **Hover / Focus:** Color-emphasis hover and explicit focus ring (recommended with `:focus-visible` outline).
- **Secondary:** Neutral background with dark text for alternate flows (for example OIDC entry).

### Cards / Containers
- **Corner Style:** `8px` on branded headers, standard Ant Design card shape for body container.
- **Background:** Neutral white/translucent for content, brand-blue for top title blocks.
- **Shadow Strategy:** Minimal, mostly inherited from framework defaults.
- **Internal Padding:** Primarily 16px to 24px scale.

### Inputs / Fields
- **Style:** Standard Ant Design textarea/input treatment.
- **Focus:** Framework focus style with clear active state.
- **Error / Disabled:** Use explicit disabled and loading states to prevent duplicate actions.

### Navigation
- **Style:** Fixed translucent top bar (`48px` height) with blur.
- **Typography:** 13px baseline with high-contrast labels.
- **States:** Blue hover affordance for terminal icon, subtle neutral hover background for user chip.

### Chips
- **Style:** Compact user chip (`4px 8px`, `6px` radius).
- **State:** Neutral default, gray hover feedback (`#f5f5f5`).

## 6. Do's and Don'ts

### Do:
- **Do** keep interaction emphasis concentrated in `#1890ff` and preserve neutral-first backgrounds.
- **Do** maintain compact spacing steps (`4px`, `8px`, `16px`, `20px`, `24px`) for predictable density.
- **Do** keep navigation and operational controls visually stable across routes.
- **Do** preserve explicit loading/disabled states on authentication and mutation actions.
- **Do** keep strong text contrast for operational readability and keyboard-focus visibility.

### Don't:
- **Don't** introduce over-decorated marketing-style dashboards that prioritize visual effects over operational clarity.
- **Don't** reproduce dense legacy-console noise patterns with unclear hierarchy and unnecessary interaction steps.
- **Don't** add gradient text, glassmorphism as default, or decorative side-stripe borders.
- **Don't** expand accent usage beyond task signaling, active states, and primary actions.
- **Don't** trade predictability for novelty in core operational workflows.
