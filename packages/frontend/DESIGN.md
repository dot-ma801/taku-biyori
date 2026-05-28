---
version: alpha
name: taku-biyori
description: >
  A calm, practical design system for a text-heavy product with a soft
  off-white light theme, a graphite dark theme, and a restrained blue accent.
colors:
  primary: '#005F6B'
  primary-strong: '#004A53'
  primary-soft: '#D7ECEE'
  on-primary: '#FFFFFF'
  secondary: '#6E7A8A'
  background: '#F4F5F1'
  surface: '#FAFAF8'
  surface-raised: '#F1F2EC'
  surface-muted: '#E9EBE4'
  surface-dark: '#25292F'
  surface-dark-raised: '#2C3138'
  surface-dark-muted: '#343941'
  border: '#D4D7CF'
  border-strong: '#B5BBB1'
  border-dark: '#434A54'
  border-dark-strong: '#59616C'
  text: '#1F2328'
  text-secondary: '#4E5661'
  text-muted: '#74808E'
  text-dark: '#F2F4F7'
  text-dark-secondary: '#CDD3DA'
  text-dark-muted: '#929AA5'
  success: '#2F8A5B'
  warning: '#C98520'
  error: '#C94F49'
  info: '#005F6B'
typography:
  headline-lg:
    fontFamily: '"Fira Code", "Fira Mono", source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace'
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.02em
  headline-md:
    fontFamily: '"Fira Code", "Fira Mono", source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace'
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.015em
  body-md:
    fontFamily: '"Fira Code", "Fira Mono", source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace'
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0
  body-sm:
    fontFamily: '"Fira Code", "Fira Mono", source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  label-md:
    fontFamily: '"Fira Code", "Fira Mono", source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace'
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.01em
  code-sm:
    fontFamily: '"Fira Code", "Fira Mono", source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label-md}'
    rounded: '{rounded.sm}'
    padding: 12px
  button-primary-hover:
    backgroundColor: '{colors.primary-strong}'
  button-secondary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    typography: '{typography.label-md}'
    rounded: '{rounded.sm}'
    padding: 12px
  button-secondary-hover:
    backgroundColor: '{colors.surface-raised}'
  button-ghost:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text-secondary}'
    typography: '{typography.label-md}'
    rounded: '{rounded.sm}'
    padding: 12px
  input-text:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    typography: '{typography.body-md}'
    rounded: '{rounded.sm}'
    padding: 12px
  card-surface:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.md}'
    padding: 24px
  chip-selected:
    backgroundColor: '{colors.primary-soft}'
    textColor: '{colors.text}'
    typography: '{typography.label-md}'
    rounded: '{rounded.full}'
    padding: 10px
  chip-unselected:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text-secondary}'
    typography: '{typography.label-md}'
    rounded: '{rounded.full}'
    padding: 10px
---

## Overview

This product should feel like a friendly, practical workbench for text and
structured content. The tone is calm, efficient, and slightly code-like rather
than playful. It should feel approachable without becoming soft or decorative.

The system uses a restrained teal-blue accent. It should read as dependable,
moderately muted, and not overly bright.

## Colors

Use a soft off-white light theme and a slightly gray dark theme. The difference
between page background and raised surfaces should stay subtle, with borders and
light shadows doing most of the separation work.

Primary color is reserved for the most important action on a screen. Secondary
actions should usually be outlined or quieter filled surfaces. Semantic colors
for success, warning, and error should remain distinct from brand blue so status
does not compete with navigation or actions.

Light theme surfaces should be neutral, low-contrast, and slightly cool:

- `background` is the page base
- `surface` is the default card and panel color
- `surface-raised` is for hoverable or grouped regions
- `surface-muted` is for inner grouping, separators, and quiet sections
- `border` and `border-strong` provide accessible structure without looking heavy

Dark theme surfaces should stay graphite-like instead of pure black:

- `surface-dark` is the base dark surface
- `surface-dark-raised` is used for panels and focused regions
- `surface-dark-muted` is for inset groupings
- `border-dark` and `border-dark-strong` keep shapes readable

## Typography

Typography should remain highly readable and consistent across the UI. Use the
same monospace family everywhere, but vary size, weight, and spacing to create
hierarchy rather than switching font families.

Headings should feel strong and compact. Body text should stay at a standard
reading size with comfortable line height. Labels should be slightly tighter and
heavier than body copy so controls remain easy to scan.

Code-like or telemetry-like text may use the same family with smaller size and
slightly reduced emphasis, but it should never become tiny or hard to read.

## Layout

Use a generous spacing rhythm with a clear but relaxed density. The layout
should breathe more than a dense admin panel, but still keep information close
enough to remain efficient.

Use a small set of spacing steps and avoid ad hoc spacing values unless there is
a strong accessibility or alignment reason. Group related items with surface
variation and padding rather than by introducing heavy visual ornaments.

Input controls and other interactive elements should keep visible borders. Large
content groupings such as sections, cards, and tables should rely more on surface
color and spacing than on thick outlines.

## Elevation & Depth

The system should avoid floating UI. Depth is subtle and functional, not
dramatic.

Use:

- very light shadows on cards or elevated panels
- crisp borders for inputs and small controls
- surface contrast for section separation

Avoid:

- heavy drop shadows
- large blur radii
- layered floating effects that make controls look detached

The goal is to make the interface feel grounded and calm while still keeping
hierarchy easy to read.

## Shapes

The shape language should stay restrained.

- `4px` radius is the default for buttons, inputs, and other interactive controls
- `8px` radius is the default for cards, panels, and larger containers
- `12px` radius is reserved for larger overlays or special surfaces
- fully rounded shapes are limited to chips, pills, and avatar-like elements

This split keeps the system practical and slightly friendly without drifting into
overly soft or generic rounded UI.

## Components

Buttons:

- Primary buttons are filled and use the brand blue
- Secondary buttons are outlined or quiet-surface buttons
- Ghost buttons should remain subdued and never compete with primary actions
- Button shadows should be minimal or absent

Inputs:

- Text inputs must have a visible border
- Normal, hover, focus, disabled, and error states are required
- Hover should feel slightly clearer, not more ornamental
- Focus should be explicit and accessible

Cards:

- Cards use subtle surface separation instead of loud elevation
- Borders may be present, but should stay light
- Padding should be generous enough to support the low-density layout

Chips:

- Selected chips are filled
- Unselected chips are outlined or quiet-surface pills
- Removable chips should include a Lucide icon for delete or dismiss actions
- Chips may be fully rounded, but should stay compact and controlled

Icons:

- Use Lucide line icons
- Keep icon weight visually light and consistent
- Icons should support the typography rather than overpower it

## Do's and Don'ts

- Do keep the UI grounded; do not make buttons float.
- Do use the brand color sparingly and intentionally.
- Do keep inputs visibly bordered for clarity and accessibility.
- Do use subtle shadows only where they genuinely help hierarchy.
- Do separate sections with surface contrast before adding extra decoration.
- Do keep corners restrained and consistent.
- Do keep semantic status colors distinct from brand blue.
- Don't over-round components.
- Don't use gradients or glossy effects.
- Don't let shadow become the main way to communicate structure.
- Don't mix too many visual languages in one screen.
