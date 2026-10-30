# Design System: MES AI ChatBot

## 1. Visual Theme & Atmosphere

An airy, restrained enterprise workspace with a calm slate foundation and a focused indigo-to-violet action color. The interface uses generous open space, translucent white surfaces, soft borders, and rounded geometry to make account and work screens feel approachable without losing their utilitarian clarity. Light mode is the clearest reference; dark mode keeps the same hierarchy on deep navy-slate surfaces.

The `/` dashboard is an application of this system: it arranges chat history, conversation, and profile/file panels as a three-column workspace. The captured narrow viewport compresses the middle brand panel, so treat the three-column arrangement as an observed desktop pattern, not a rule for narrow screens.

## 2. Color Palette & Roles

### Core surfaces and text

- **Cool Mist Canvas** (`#F1F5F9`): outer light-mode backdrop, often blended with a faint indigo tint toward the center and a pale slate edge.
- **Paper White** (`#FFFFFF`): primary cards and modal surfaces; forms use a slightly translucent white treatment (`95%`).
- **Deep Ink Slate** (`#0F172A`): primary text and the main dark-surface family.
- **Muted Slate** (`#64748B`): supporting copy, secondary labels, and low-emphasis details.
- **Soft Slate Border** (`#E2E8F0`): card and input outlines; many surfaces use reduced opacity for a quieter edge.
- **Input Mist** (`#F8FAFC`): resting input background in light mode.

### Accent and state colors

- **Focused Indigo** (`#4F46E5`): primary action gradient start, focus border, selected states, and active icons.
- **Violet Accent** (`#7C3AED`): primary action gradient end, adding a small amount of energy to key actions.
- **Pale Indigo Wash** (`#EEF2FF`): subtle highlighted and selected backgrounds.
- **Deep Night Canvas** (`#090D16`): dark-mode page background.
- **Night Slate Surface** (`#0F172A`): dark cards and modal surfaces; inputs and nested regions step up to slate (`#1E293B`).
- **Dark Slate Border** (`#1E293B`): dark-mode card outlines; controls may use the next lighter slate (`#334155`) for definition.
- **Soft Rose** (`#E11D48`): destructive or logout actions, paired with a pale rose background when the action is secondary.

Color utilities with alpha (such as white at 90–95%, slate borders at 80%, or indigo focus rings at 15%) are overlays on their respective surfaces; preserve that translucent quality instead of treating them as opaque palette swatches.

## 3. Typography Rules

Use **Pretendard GOV Variable** with the Korean-capable system sans-serif stack as fallback. The global letter spacing is slightly tight (`-0.015em`), giving Korean and Latin UI copy a compact, polished rhythm.

- Page and modal titles are compact and strong: typically 24px extra-bold with tight tracking on account forms, and 18px bold in settings headers.
- Panel headings and primary labels use bold or semibold weights to establish hierarchy without large type jumps.
- Field labels and helper text are intentionally small (about 12px); standard control and supporting copy is generally 14px.
- Secondary descriptions use muted slate and short line lengths. Avoid adding decorative display typography to otherwise functional account screens.

## 4. Component Stylings

* **Buttons:** Primary actions use a left-to-right indigo-to-violet gradient (`#4F46E5` → `#7C3AED`), white semibold text, gently rounded corners (about 12px on form actions and 16px on dashboard actions), and a soft indigo shadow. Hover shifts the gradient slightly lighter; pressed states may scale down very subtly. Secondary actions use a pale slate fill with a light border. Destructive actions use rose red sparingly.
* **Cards/Containers:** Main forms are centered, medium-width cards (`max-width: 28rem`) with generous padding, a large 24px radius, a fine border, and a diffused shadow. Dashboard panels use the same rounded, bordered surface language with restrained blur and lighter shadows. Settings is a wider dialog (`max-width: 32rem`) with a 24px radius, clipped contents, and a stronger shadow above a dimmed, softly blurred scrim.
* **Inputs/Forms:** Inputs are full-width, about 56px high, with a pale slate fill, thin slate border, 12px corner radius, and compact leading icon. Labels sit just above each field. Focus changes the border to indigo and adds a faint indigo ring; dark mode raises the input surface to slate without changing the hierarchy.
* **Icon treatments:** Use simple outline icons in muted slate for field affordances. Settings and account icons sit in small pale-indigo tiles, with indigo foregrounds. Keep icons subordinate to labels.
* **Settings rows and badges:** Group settings in softly tinted, 16px-radius sections with thin borders. Interactive rows use smaller rounded corners and subtle surface changes on hover. Count, role, and version badges are compact pills or softly rounded chips in muted or pale accent colors.
* **Conversation surfaces:** Dashboard message bubbles are rounded and differentiated by alignment and fill. User messages reuse the primary indigo-violet gradient; assistant content remains on a quiet slate surface with a fine border.

## 5. Layout Principles

Center account flows in the viewport and keep them within a readable medium-width column. Use consistent internal padding (32–40px on larger form cards), about 16px between form fields, and a little more separation between the title area, form, and footer links. Let the pale gradient canvas remain visible around the card.

Settings uses a centered overlay dialog with viewport padding, a distinct header separated by a fine rule, and a vertically scrollable body. Sections have clear breathing room and their own grouped surfaces.

The dashboard implementation uses a padded three-column workspace: a fixed-width conversation sidebar, a flexible chat area, and a fixed-width profile/file rail, separated by even gaps. Treat this as a layout example from `/`; at narrower widths the current implementation can squeeze the center column, so choose an explicit responsive adaptation when designing a new screen rather than copying that squeeze.

## Evidence & Scope

This system was synthesized from the `/`, `/login`, `/settings`, and `/reset-pw` implementations and a browser review of their rendered states. `/reset-pw` refers to the email-request form only; the unfinished `PasswordResetForm` was excluded. The settings account lookup was not needed to establish visual patterns. No Stitch project or Stitch tools were available in this workspace, so the repository and local browser rendering served as the source material.
