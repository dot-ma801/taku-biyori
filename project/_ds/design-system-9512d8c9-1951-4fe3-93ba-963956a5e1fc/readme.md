# たく日和 — Design System

「たく日和」(taku-biyori) is a consumer web app for organising **sessions** of murder mystery
and TRPG games: creating a 卓 (a table/session), picking a scenario, coordinating dates with
your group, and keeping notes and members in one place.

The brand idea is **青空と白い雲、その中に小さく差す太陽の色** — a blue sky, white clouds, and a
small stroke of sun inside it. The product should feel like *a clear day, just before everyone
starts a story together*: bright and quiet at the same time. It is deliberately **not** a
family board-game brand (bright, poppy, childish) and **not** a murder-mystery brand
(black/purple/red, heavy, occult). Game-ness lives in small accents — a dice icon, a door,
a key — never in the overall look.

## Sources

This system was built **from a written brand brief only**. There was:

- no codebase, repository or Figma file,
- no logo or brand asset files,
- no font binaries,
- no existing screenshots or product copy.

Everything here — palette values, type scale, component inventory, screen designs and the
Japanese copy — was authored from that brief. If real assets exist, they should replace the
substitutions listed under **Substitutions & caveats** below.

## Design principles

Applied in this order, every time:

1. **Readable** — Japanese text first: 1.75–1.85 line-height, no ultra-bold, no tiny captions.
2. **Calm** — few colours per screen, near-invisible shadows, short soft motion.
3. **Friendly** — 親しみやすい, not かわいい. Soft corners, but not everything is a pill.
4. **Story-focused** — the scenario and the people are the content; chrome recedes.
5. **Accessible** — WCAG-minded contrast in both themes, 44px+ touch targets, visible focus.
6. **Consistent** — one status vocabulary, one icon family, one radius set.

---

## VISUAL FOUNDATIONS

### Colour

Three families, all defined in `tokens/colors.css`.

- **Sky (青空) — primary.** `--sky-50` → `--sky-950`. A settled sky blue, not a vivid cyan.
  Light mode primary is `--sky-600` `#336fae`; dark mode lightens to `#7db4e6` so it keeps
  ≥4.5:1 against the navy surfaces.
- **Sun (太陽) — accent.** `--sun-50` → `--sun-700`, brand accent `--sun-300` `#f9cb4e`.
  Yellow is the brand's signature but it is **rationed**: the active tab underline, a selected
  state, one CTA per screen, the logo, the "best date" callout. Never a yellow page, never a
  yellow header, never yellow body text.
- **Ink — neutrals.** Blue-tinted greys, `--ink-0` → `--ink-950`. Body text is `--ink-900`
  `#1a2230`, never `#000`.
- **Semantic.** success (muted green `#2f8d68`), info (a duller blue than primary, `#3c7fb0`),
  warning (`#b9812a`), error (`#bf4f4c`). All desaturated so they read as state, not as brand.

**Semantic tokens are the public API.** Consumers use `--background`, `--surface`,
`--surface-subtle`, `--text-primary`, `--text-secondary`, `--text-disabled`, `--border`,
`--primary`, `--primary-hover`, `--accent`, `--success`, `--warning`, `--error` and friends —
never the raw scales. The same names exist under `[data-theme="dark"]`, so a component written
once works in both themes.

### Light and dark

Dark mode is not an inversion; it is **the same sky, later**. Background `#0e1826` (deep navy,
never black), surface `#16222f`, raised surface `#1f2d3d`. Hierarchy in dark mode comes from
*surfaces getting lighter*, with shadow only deepening the separation. The sun accent stays
exactly the same hue — the brand does not change colour at night. `SkyScene` swaps its gradient
via `--sky-scene`, so the illustration becomes a night sky automatically.

### Typography

- **Display / headings:** Zen Kaku Gothic New (400/500/700) — humanist, calm, not cute.
- **Body / UI:** Noto Sans JP (400/500/600/700).
- Scale: Display 40 · H1 32 · H2 24 · H3 20 · Body L 18 · Body 16 · Body S 14 · Label 13 ·
  Caption 12 · Overline 11. Nothing heavier than 700, nothing larger than 40px in the app.
- Utility classes `.ds-display`, `.ds-h1` … `.ds-overline` are shipped for prototyping.

### Spacing & layout

4px base (`--space-1` … `--space-24`). Card padding 20px, block gaps 16px, inline gaps 8px,
section gaps 40px, page gutter 24px. Content column is `--container-lg` 1080px, centred, with a
60px top nav. Layouts are two-column (1.4fr / 1fr) on desktop: primary content left,
status and metadata right. Whitespace is the main compositional tool — err toward more.

### Shape

`--radius-xs 4` (badges, checkboxes) · `sm 6` (buttons, inputs) · `md 10` (cards) ·
`lg 16` (modals/sheets) · `full` (chips, avatars, switches). Cards are 10px — soft, not round.
Badges stay rectangular at 4px precisely so they don't read as cute pills; chips get the pill.

### Border, shadow, elevation

Hierarchy is carried by **border colour and surface colour first, shadow last**.
`--border-subtle` for card outlines, `--border` for fields, `--border-strong` for hover.
The shadow scale is deliberately faint: `xs` is a 1px 4%-black hairline; `lg` (28px blur, 10%)
is reserved for modals and toasts. A resting card has a 1px subtle border and almost no shadow;
on hover it gains `--shadow-md` and lifts 1px.

### Motion

90–360ms, `cubic-bezier(.2,0,.2,1)` for state changes and `cubic-bezier(.16,1,.3,1)` for
entrances. Fades and short 8–10px rises. **No bounce, no spring, no scale-up.** Hover changes
background/border colour (never opacity). Press deepens the colour one step (never shrinks the
element). Focus is a 3px 32%-primary ring plus a colour change on the border.
`prefers-reduced-motion` zeroes every duration.

### Transparency & blur

Almost none. The only translucency is the modal overlay (`--overlay`, navy at 42% / 62%) and
the soft fade at the bottom of `SkyScene`. No frosted glass, no backdrop blur.

### Imagery & illustration

No photography and no character art were supplied. The single piece of brand imagery is
`SkyScene` — an abstract sky band built from a vertical gradient, a soft sun glow in the upper
right, and two or three simple white cloud forms. It is intentionally almost empty so headings
can sit in it. In dark mode the same component becomes a night sky. If real illustration
arrives, it should follow the same brief: 青空 / 雲 / 遠景 / 窓 / 卓 / 本 / 夜空, quiet, with lots
of empty space, day in light mode and *the same world at night* in dark mode.

---

## CONTENT FUNDAMENTALS

- **Language:** Japanese, polite です／ます. English appears only as small `Overline` eyebrows
  (`Next`, `Schedule`, `Open`) and never carries information.
- **Person:** address the user directly and warmly — 「こんにちは、さくらさん」, 「今週は2つの卓が
  待っています。」 The product refers to itself rarely and never as 「私たち」.
- **Buttons are verbs in plain form:** 卓をつくる · 参加する · 回答を送信 · この日で確定する ·
  保存する · コピー. Cancel is always キャンセル. Destructive is the literal action (中止する),
  never 「はい」.
- **Status labels are a fixed vocabulary** and must be used verbatim:
  募集中 · 調整中 · 開催予定 · 完了 · 中止 · GM · PL · 回答済み · 未回答.
- **Empty states reassure, they do not apologise.** 「まだ卓がありません」 + 「最初の卓をつくると、
  ここに予定が並びます。」 + one action. No 「ごめんなさい」, no exclamation marks.
- **Errors are instructions, not blame:** 「卓の名前を入力してください」, 「通信状況を確認して
  もう一度お試しください。」
- **Helper text is permission-giving:** 「あとから変更できます」, 「未定のままでも作成できます」.
- **Casing & punctuation:** no ALL CAPS in Japanese; Overline labels are uppercase Latin with
  0.14em tracking. Numbers are half-width (`3 / 5 人`, `19:30〜`). Dates are written
  `3月22日(金) 19:30〜`.
- **Emoji: never.** The only glyph-like marks in copy are ○ / △ / × / − in scheduling answers.
- **Tone check:** if a sentence sounds like a game shop, rewrite it. If it sounds like a
  library notice on a sunny afternoon, it's right.

---

## ICONOGRAPHY

- **One family, line only.** 24×24 grid, `1.75` stroke, round caps and joins, no fills, no
  duotone, no decorative board-game emblems.
- Icons are addressed by **semantic name** through the `Icon` component:
  `home · session · scenario · character · calendar · schedule · user · members · message ·
  memo · link · dice · search · filter · edit · delete · add · check · settings · more ·
  external-link · close · sun · moon · cloud · bell · info · success · warning · error ·
  loading · clock · place · key · door · star · tune · arrow-right · chevron-left/right/down`.
  `ICON_NAMES` exports the full list.
- Icons inherit `currentColor` and sit at 14–20px inline, 24px in feature spots. Metadata icons
  use `--text-tertiary`; icons inside buttons take the button's colour.
- **No emoji, no unicode pictographs as icons.** ○ / △ / × / − are used as *data* in scheduling
  answers, not as iconography.
- **TRPG accents** (`dice`, `key`, `door`, `star`, `drama`) exist but are rare — at most one per
  screen, never in navigation. Dice is explicitly not a mascot.

**Substitution:** no brand icon set was supplied, so the system uses **Lucide** (ISC licensed),
whose 24px/1.75-stroke geometry matches the brief. The 42 SVGs actually used are copied into
`assets/icons/` and inlined into `components/core/Icon.jsx`, so there is no CDN dependency.
Replace them one-for-one if a house set is drawn later.

---

## Substitutions & caveats

- **No logo file was supplied.** `Logo` is therefore typographic: a small sky tile (blue
  gradient, sun dot, two clouds) plus たく日和 set in the display face. Nothing here should be
  taken as the real mark — supply a logo and swap it in.
- **Fonts are loaded from Google Fonts** (`tokens/fonts.css` uses an `@import`), because no font
  binaries were provided. Zen Kaku Gothic New and Noto Sans JP are both close to the brief; if a
  licensed brand face exists, drop the `.woff2` files into `assets/fonts/` and replace the
  import with `@font-face` rules.
- **Icons are Lucide**, not a house set (see above).
- **Illustration is abstract.** `SkyScene` is geometry, not drawn artwork.

---

## Index

Root files:

| File | What it is |
| --- | --- |
| `styles.css` | The single entry point consumers link. `@import`s only. |
| `tokens/colors.css` | Palette + light/dark semantic tokens. |
| `tokens/typography.css` | Type scale, weights, tracking, `.ds-*` classes. |
| `tokens/spacing.css` | 4px spacing scale, containers, nav height. |
| `tokens/shape.css` | Radius and border tokens. |
| `tokens/elevation.css` | Shadow scale, light and dark. |
| `tokens/motion.css` | Durations and easings. |
| `tokens/fonts.css` | Webfont loading + family tokens. |
| `tokens/base.css` | Minimal reset, link colours, focus ring. |
| `thumbnail.html` | Homepage tile. |
| `SKILL.md` | Agent-skill entry point. |
| `assets/icons/` | The 42 Lucide SVGs used by `Icon`. |
| `guidelines/*.card.html` | Foundation specimen cards (colour, type, spacing, elevation, icons, status). |

### Components

`components/brand/` — **Logo**, **SkyScene**

`components/core/` — **Icon**, **Button**, **IconButton**

`components/forms/` — **FormField**, **TextInput**, **Textarea**, **Select**, **DateInput**,
**Checkbox**, **Radio**, **Switch**

`components/display/` — **Card** (+ **CardHeader**), **SessionCard**, **ScenarioCard**,
**ScheduleCard**, **MemberCard**, **Badge**, **Chip**, **Avatar** (+ **AvatarGroup**)

`components/navigation/` — **GlobalNav**, **Tabs**, **Breadcrumb**, **Pagination**

`components/feedback/` — **Alert**, **Toast** (+ **ToastStack**), **Modal**, **Dialog**,
**Tooltip**, **EmptyState**, **Spinner**, **Skeleton** (+ **SkeletonCard**)

Each component directory holds `<Name>.jsx`, `<Name>.d.ts` (props contract),
`<Name>.prompt.md` (what & when + usage), and one `@dsCard` HTML specimen.

**Intentional additions** (not named in the brief, added because the brief's own screens need
them): `Avatar` / `AvatarGroup` (Session and Member cards must show participants and no avatar
imagery was supplied), `FormField` (the brief asks for helper text and error messages, which
need one shared wrapper), `Card` / `CardHeader` (a base surface under the four named card
types), `Spinner` (the "Loading" feedback item), `SkyScene` and `Logo` (the brief's Brand/Logo
and Illustration deliverables), `Icon` (a wrapper for the line-icon set).

### UI kit

`ui_kits/taku-biyori-app/` — an interactive recreation of the app: home, 卓一覧, 卓詳細
(tabs: 概要 / メンバー / メモ), 日程調整, シナリオ, メンバー, a 卓をつくる modal, toasts, a
destructive dialog, and a working light/dark toggle in the nav. See its own `README.md`.
