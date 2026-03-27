# Civic Warmth — Theme Definition

A custom theme for the Agora application, designed to balance democratic gravitas with contemporary warmth and citizen engagement.

## Typography

### Display / Headers

- **Font**: Sora (Google Fonts)
- **Character**: Geometric sans-serif with subtly rounded terminals
- **Weights**: 600 (section heads), 700 (page titles), 800 (hero display)
- **Personality**: Modern, trustworthy, warm without being playful

### Body / UI

- **Font**: Figtree (Google Fonts)
- **Character**: Humanist sans-serif, open apertures, contemporary warmth
- **Weights**: 400 (body), 500 (labels/UI), 600 (emphasis)
- **Personality**: Approachable, excellent readability, never generic

### Data / Accents

- **Font**: JetBrains Mono (Google Fonts)
- **Character**: Developer-grade monospace with programming ligatures
- **Weights**: 400 (inline data), 500 (featured numbers)
- **Use**: Vote tallies, dates, reference codes, percentages

## Color Palette

### Core


| Token               | Hex       | Usage                                     |
| ------------------- | --------- | ----------------------------------------- |
| `primary`           | `#1E3A5F` | Deep warm navy — brand, trust, authority  |
| `primary-dark`      | `#142942` | Hover states, footer background           |
| `primary-light`     | `#2A4F7A` | Active states, secondary emphasis         |
| `accent-coral`      | `#E85D3A` | Energy, CTAs, "Aujourd'hui" section       |
| `accent-coral-dark` | `#D04A28` | Coral hover state                         |
| `accent-teal`       | `#2BA89E` | Fresh secondary, "Calendrier" section     |
| `accent-teal-dark`  | `#1F8A82` | Teal hover state                          |
| `accent-amber`      | `#F0A030` | Highlights, achievements, "Votes" section |
| `accent-amber-dark` | `#D98B1A` | Amber hover state                         |
| `accent-plum`       | `#7B5EA7` | Education, "Comprendre" section           |
| `accent-plum-dark`  | `#654B8E` | Plum hover state                          |


### Backgrounds


| Token         | Hex       | Usage                            |
| ------------- | --------- | -------------------------------- |
| `bg`          | `#FAFAF7` | Page background — warm off-white |
| `bg-alt`      | `#F4F2EE` | Section backgrounds, alternating |
| `bg-card`     | `#FFFFFF` | Card surfaces                    |
| `bg-elevated` | `#FFFFFF` | Elevated cards, modals           |
| `bg-input`    | `#F7F6F3` | Input fields                     |
| `bg-footer`   | `#142942` | Footer — deep navy               |


### Text


| Token              | Hex       | Usage                              |
| ------------------ | --------- | ---------------------------------- |
| `text`             | `#2A2A2A` | Primary body text                  |
| `text-secondary`   | `#5C5C5C` | Secondary / supporting text        |
| `text-muted`       | `#7A7A7A` | Captions, timestamps, metadata     |
| `text-on-dark`     | `#FFFFFF` | Text on primary/dark backgrounds   |
| `text-on-dark-alt` | `#C8D6E5` | Secondary text on dark backgrounds |


### Borders


| Token          | Hex       | Usage               |
| -------------- | --------- | ------------------- |
| `border`       | `#E5E2DC` | Default warm border |
| `border-light` | `#F0EDE7` | Subtle dividers     |
| `border-focus` | `#1E3A5F` | Focus ring color    |


### Semantic Status


| Token          | Hex       | Usage                   |
| -------------- | --------- | ----------------------- |
| `success`      | `#2E8B57` | Adopted, positive       |
| `success-dark` | `#1E6B3E` | Success hover           |
| `success-bg`   | `#EDF7F0` | Success background tint |
| `error`        | `#D14654` | Rejected, errors        |
| `error-dark`   | `#B53440` | Error hover             |
| `error-bg`     | `#FDF0F0` | Error background tint   |
| `warning`      | `#C48A1A` | Warnings, pending       |
| `warning-bg`   | `#FDF8ED` | Warning background tint |


### Section Colors (Guardian-inspired navigation coding)


| Section     | Color | Hex       |
| ----------- | ----- | --------- |
| Aujourd'hui | Coral | `#E85D3A` |
| Votes       | Amber | `#F0A030` |
| Calendrier  | Teal  | `#2BA89E` |
| Explorer    | Navy  | `#1E3A5F` |
| Comprendre  | Plum  | `#7B5EA7` |


## Shadows

All shadows use a warm navy tint instead of pure black for cohesion.


| Token          | Value                               | Usage           |
| -------------- | ----------------------------------- | --------------- |
| `shadow-sm`    | `0 1px 3px rgba(30, 58, 95, 0.06)`  | Subtle lift     |
| `shadow`       | `0 2px 8px rgba(30, 58, 95, 0.08)`  | Default cards   |
| `shadow-md`    | `0 4px 12px rgba(30, 58, 95, 0.10)` | Hover elevation |
| `shadow-lg`    | `0 8px 24px rgba(30, 58, 95, 0.12)` | Modals, popups  |
| `shadow-focus` | `0 0 0 3px rgba(30, 58, 95, 0.15)`  | Focus rings     |


## Spacing Scale


| Token | rem  | px  |
| ----- | ---- | --- |
| `xs`  | 0.25 | 4   |
| `sm`  | 0.5  | 8   |
| `md`  | 0.75 | 12  |
| `lg`  | 1    | 16  |
| `xl`  | 1.5  | 24  |
| `2xl` | 2    | 32  |
| `3xl` | 3    | 48  |
| `4xl` | 4    | 64  |


## Border Radius


| Token  | Value | Usage                  |
| ------ | ----- | ---------------------- |
| `sm`   | 4px   | Small elements, tags   |
| `md`   | 8px   | Cards, inputs          |
| `lg`   | 12px  | Featured cards, modals |
| `xl`   | 16px  | Hero cards             |
| `pill` | 999px | Badges, pills, toggles |


## Motion


| Token             | Value                             | Usage                      |
| ----------------- | --------------------------------- | -------------------------- |
| `duration-fast`   | 150ms                             | Hovers, micro-interactions |
| `duration-normal` | 250ms                             | State transitions          |
| `duration-slow`   | 400ms                             | Page entrance, reveals     |
| `ease-out`        | cubic-bezier(0.25, 0, 0, 1)       | Standard deceleration      |
| `ease-out-expo`   | cubic-bezier(0.16, 1, 0.3, 1)     | Entrance animations        |
| `ease-spring`     | cubic-bezier(0.34, 1.56, 0.64, 1) | Playful bounces            |


## Design Principles (quick reference)

1. **Warm over cold**: Every default leans warm — shadows, backgrounds, borders
2. **Section identity**: Navigation sections carry their accent color throughout their pages
3. **Cards float, not cage**: Elevation via shadow, not border imprisonment
4. **Type as architecture**: Dramatic scale contrast between display and body
5. **Data as design**: Vote bars, timelines, heatmaps are visual-first, not afterthought charts
6. **Motion as meaning**: Animations orient and delight, never distract
7. **Density when needed**: Editorial breathing room by default, information density in data views

