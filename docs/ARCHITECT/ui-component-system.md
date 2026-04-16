# UI Component System

> See also: ARCHITECTURE.md -- "Tech Stack > Styling", "Component Architecture > Layout Components", "Component Architecture > Control Components"

## Overview

Stage uses a layered UI component system built on Radix UI primitives, styled with Tailwind CSS 4, and organized following the shadcn/ui pattern. The editor layout follows a three-panel architecture (left controls, center canvas, right settings) with a responsive mobile fallback using a side sheet. Motion (framer-motion) handles animations, and class-variance-authority (CVA) manages component variants.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component primitives | **Radix UI** | Accessible, unstyled headless components (dialog, dropdown, slider, tooltip, etc.) |
| CSS framework | **Tailwind CSS 4** | Utility-first, zero-runtime, CSS-native config with `@theme` directives |
| Component library pattern | **shadcn/ui (new-york style)** | Copy-paste components in `components/ui/`; full control, no dependency lock-in |
| Variant styling | **class-variance-authority (CVA)** | Type-safe variant definitions for buttons, badges, etc. |
| Animation | **Motion (framer-motion)** | Declarative spring/tween animations, AnimatePresence for enter/exit |
| Icon library | **Hugeicons** | Primary icon set; lucide-react available as secondary |
| shadcn/ui config style | **new-york** | Compact, refined aesthetic matching the editor's dense panel layout |
| Editor layout | **Three-panel with responsive sheet** | Desktop: left (240px) + center (flex) + right (240px). Mobile: full-width canvas + side sheet |
| CSS variables | **Enabled** | Theme tokens as CSS custom properties for runtime dark/light mode switching via next-themes |
| Additional registries | **Aceternity UI + Magic UI** | Extended component registries for landing page effects (moving borders, hero video, etc.) |
| Notifications | **Sonner** | Toast notification system, wrapped in `components/ui/sonner.tsx` |

## Key Files

| File | Purpose |
|------|---------|
| `components.json` | shadcn/ui config: style (new-york), aliases, registries, Tailwind CSS path |
| `app/globals.css` | Global styles, Tailwind directives, CSS variable theme tokens |
| `components/ui/` | 29 shadcn/ui base components (button, dialog, slider, sheet, etc.) |
| `components/editor/EditorLayout.tsx` | Top-level editor shell: header, three-panel layout, timeline, mobile sheet |
| `components/editor/LeftEditPanel.tsx` | Left panel: mode dropdown, tab nav (Design/BG/Layers), control sections |
| `components/editor/RightSettingsPanel.tsx` | Right panel: 3D transforms + animation presets with interactive preview |
| `components/editor/unified-right-panel.tsx` | Mobile-optimized panel: all 6 tabs (Design/Layers/BG/Adjust/3D/Motion) in a sheet |
| `components/controls/` | Individual editor controls (BorderControls, ShadowControls, Perspective3DControls, etc.) |
| `components/landing/` | Landing page components (Hero, FAQ, Navigation, Testimonials, etc.) |
| `components/GlobalDropZone.tsx` | App-wide drag-and-drop overlay with animated feedback |

## Data Flow

### Editor Layout Structure

```
EditorLayout
  |
  +-- EditorHeader              (top bar: logo, actions, feedback)
  |
  +-- MobileBanner              (mobile-only: info banner)
  |
  +-- Main content area (flex row)
  |     |
  |     +-- LeftEditPanel       (desktop only, 240px, border-r)
  |     |     |-- ModeDropdown  (Screenshot | Browser mode)
  |     |     |-- Tab Nav       (Design | BG | Layers)
  |     |     |-- Tab Content   (control sections per tab)
  |     |     +-- Templates Overlay (slide-in preset gallery)
  |     |
  |     +-- Center              (flex-1)
  |     |     |-- EditorContent > EditorCanvas
  |     |     |-- Floating "Animate" button (when timeline hidden)
  |     |     +-- TimelineEditor (when timeline visible)
  |     |
  |     +-- RightSettingsPanel  (desktop only, 240px, border-l)
  |     |     |-- Tab Nav       (3D | Motion)
  |     |     |-- TransformControls (zoom/tilt preview + sliders)
  |     |     +-- AnimationControls (preset gallery)
  |     |
  |     +-- Mobile Sheet        (mobile only, 460px side sheet)
  |           +-- UnifiedRightPanel (all 6 tabs combined)
  |
  +-- Footer spacer             (desktop only, half-navbar height)
```

### Panel Responsibilities

| Panel | Width | Tabs | Content |
|-------|-------|------|---------|
| Left (desktop) | 240px | Design, BG, Layers | Style, border, shadow, tweet import, code snippet, image overlay, annotate, text, settings |
| Right (desktop) | 240px | 3D, Motion | Transform preview with drag interaction, perspective sliders, animation preset gallery |
| Unified (mobile) | 460px | Design, Layers, BG, Adjust, 3D, Motion | All controls in a single Sheet |

### Tab Transition Pattern

All panels use a consistent fade transition when switching tabs:

1. `activeTab` changes via click
2. `transitioning` flag set to `true`, content fades out (opacity 0, translateY 4px)
3. After 150ms timeout, `contentKey` updates to new tab
4. `transitioning` set to `false`, content fades in

## Control Components

Located in `components/controls/`, each control is a self-contained component that reads from and writes to Zustand stores:

| Component | Purpose |
|-----------|---------|
| `BorderControls.tsx` | Border style, width, radius, and color configuration |
| `ShadowControls.tsx` | Drop shadow customization (blur, offset, spread, color) |
| `Perspective3DControls.tsx` | 3D perspective transform controls (rotateX/Y/Z, perspective distance) |
| `BackgroundEffects.tsx` | Background blur and noise overlay controls |
| `UploadDropzone.tsx` | File upload area with react-dropzone integration |
| `WebsiteScreenshotInput.tsx` | URL input for website screenshot capture |
| `CleanUploadState.tsx` | Utility to reset upload state |

## shadcn/ui Configuration

From `components.json`:

- **Style**: new-york
- **RSC**: enabled
- **TSX**: enabled
- **CSS**: `app/globals.css`
- **Base color**: gray
- **CSS variables**: enabled
- **Icon library**: lucide (shadcn default; app primarily uses hugeicons)
- **Registries**: `@aceternity` (ui.aceternity.com), `@magicui` (magicui.design)

### Base UI Components (components/ui/)

| Component | Source | Usage |
|-----------|--------|-------|
| `button.tsx` | shadcn/ui | CVA variants (default, ghost, outline, destructive) |
| `slider.tsx` | Radix UI Slider | Extended with label and value display props |
| `sheet.tsx` | Radix UI Dialog | Mobile panel container |
| `dialog.tsx` | Radix UI Dialog | Modal dialogs (export settings, coming soon) |
| `dropdown-menu.tsx` | Radix UI Dropdown | Context menus and action menus |
| `select.tsx` | Radix UI Select | Form select inputs |
| `tabs.tsx` | Radix UI Tabs | Tab containers |
| `tooltip.tsx` | Radix UI Tooltip | Hover tooltips |
| `accordion.tsx` | Radix UI Accordion | Collapsible sections (FAQ) |
| `popover.tsx` | Radix UI Popover | Color pickers, popovers |
| `segmented-control.tsx` | Custom | Animated tab selector (zoom/tilt toggle) |
| `tilt-joystick.tsx` | Custom | Interactive drag control for 3D perspective |
| `color-picker.tsx` | Custom | Color selection with presets |
| `glass-input-wrapper.tsx` | Custom | Frosted glass input styling |
| `hero-video-dialog.tsx` | Magic UI registry | Landing page video showcase |
| `moving-border.tsx` | Aceternity UI registry | Animated border effect for landing page |
| `cached-image.tsx` | Custom | Image component with caching |
| `optimized-image.tsx` | Custom | Optimized image loading component |
| `sonner.tsx` | Sonner wrapper | Toast notification provider |

## GlobalDropZone Pattern

`GlobalDropZone` wraps the entire application to provide universal drag-and-drop image uploading:

1. **Document-level event listeners**: `dragenter`, `dragover`, `dragleave`, `drop` on `document`
2. **Drag counter ref**: Tracks nested drag events to prevent premature overlay hide
3. **File validation**: Checks MIME type against allowlist and file size against max
4. **Context-aware behavior**:
   - No main image loaded: Sets as primary canvas image
   - Has main image (editor page): Adds as image overlay at random position offset
   - Non-editor page: Sets as primary image and navigates to editor
5. **Paste handler**: Listens for clipboard paste events on non-editor pages
6. **Animated overlay**: Full-screen blur backdrop with dashed border, animated arrow icon, and processing spinner via Motion `AnimatePresence`

## Landing Page Components

Located in `components/landing/`, the landing page is composed of modular sections:

| Component | Purpose |
|-----------|---------|
| `LandingPage.tsx` | Root composition of all landing sections |
| `Navigation.tsx` | Top navigation bar |
| `Hero.tsx` | Hero section with CTA |
| `EditorPreview.tsx` | Interactive editor demo |
| `HowItWorks.tsx` | Feature walkthrough steps |
| `ValueProposition.tsx` | Key benefits grid |
| `MasonryGrid.tsx` | Image showcase grid |
| `Testimonial.tsx` | User testimonial cards |
| `VideoTestimonials.tsx` | Video testimonial embeds |
| `SocialProof.tsx` | Social proof indicators |
| `Sponsors.tsx` | Sponsor logos |
| `BackedBy.tsx` | Backer/investor logos |
| `FAQ.tsx` | Frequently asked questions (accordion) |
| `Pricing.tsx` | Pricing tiers |
| `FinalCTA.tsx` | Bottom call-to-action |
| `Footer.tsx` | Site footer |
| `StructuredData.tsx` | JSON-LD schema for SEO |
| `Marquee.tsx` | Scrolling marquee effect |

## Trade-offs & Alternatives Considered

| Alternative | Why not chosen |
|-------------|---------------|
| Chakra UI / MUI | Heavier runtime; shadcn/ui gives full ownership of component code with no dependency lock-in |
| CSS Modules | Less composable than Tailwind utilities; harder to maintain design consistency across editor panels |
| Tailwind CSS 3 | v4 offers native CSS config (`@theme`), faster compilation, and CSS-first approach |
| Single right panel on desktop | Two narrow panels (left: editing, right: transforms) keeps controls contextually grouped without overwhelming scroll depth |
| React Spring for animations | Motion (framer-motion) has broader ecosystem, AnimatePresence for enter/exit, and better React 19 support |
| Headless UI (Tailwind Labs) | Radix UI has wider primitive coverage (slider, tooltip, accordion) and stronger accessibility defaults |
| Separate mobile app/layout | Sheet-based responsive approach reuses all existing section components via UnifiedRightPanel; zero duplication |
