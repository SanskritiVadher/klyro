# Klyro — Design System & Visual Identity

> **Official Tagline:** *“Clarity you can act on.”*

## 1. Product Identity & Brand Personality

**Klyro** is an intelligent personal financial intelligence workspace designed for students, salaried professionals, and first-time budgeters.
- **Brand Personality:** Intelligent, futuristic, precise, calm, and approachable.
- **Product Positioning:** A personal financial intelligence workspace that helps users understand their spending, forecast their financial future, and know how much they can safely spend.
- **Design Philosophy:** Avoids generic blue-purple gradients, conventional fintech dashboard templates, and excessive glassmorphism. Employs warm ivory surfaces, charcoal/espresso typography, burnt coral action accents, and restrained muted tones.

**Core Axiom:** *Financial data can be complex. Understanding it should feel effortless.*

---

## 2. Color Palette & Semantic Tokens

| Token Name | Hex Code | Role & Semantics |
| :--- | :--- | :--- |
| `--surface-parchment` | `#FBF9F5` | Canvas background — soft, warm, easy on the eyes |
| `--surface-paper` | `#FFFFFF` | Primary content cards, modals, sheets |
| `--surface-paper-subtle` | `#F5F2EB` | Secondary containers, table header fills, rail background |
| `--surface-paper-hover` | `#EFECE4` | Interactive row & card hover state |
| `--border-warm` | `#E5E0D5` | Tactile ledger border lines, divider rules |
| `--border-strong` | `#D6CEBE` | Active controls, focus rings, distinct outlines |
| `--text-ink` | `#1A1816` | Headlines, primary financial figures, high-contrast text |
| `--text-body` | `#3C3833` | Body copy, table cells, form labels |
| `--text-muted` | `#787168` | Secondary labels, timestamp metadata, hints |
| `--coral-primary` | `#D45644` | Burnt coral — primary action, expense emphasis, quick capture |
| `--coral-hover` | `#BD4534` | Burnt coral hover state |
| `--marigold-accent` | `#D97706` | Saffron/Marigold — upcoming bills, commitments, alerts |
| `--sage-positive` | `#2D7A58` | Muted sage — income, positive savings, healthy budget status |
| `--terracotta-warning`| `#B84A39` | Soft terracotta — overspending, tightening cash-flow, critical risk |

---

## 3. Typography Hierarchy

- **Display & Large Figures:** `Fraunces` / `Newsreader` / serif display font with optical size adjustments, tabular numbers (`tnum`), and distinct editorial character.
- **Interface & Data:** `Plus Jakarta Sans` / `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto` for controls, forms, tables, and microcopy.
- **Number Formatting:** Always rendered with tabular lining figures (`font-variant-numeric: tabular-nums`) so decimal points and digit columns align vertically.

| Style Role | Font Family | Size | Weight | Line Height |
| :--- | :--- | :--- | :--- | :--- |
| Hero Balance | Serif Display | 2.5rem (40px) | 700 | 1.15 |
| Section Headline | Serif Display | 1.5rem (24px) | 600 | 1.25 |
| Subhead / Card Title | Sans-Serif | 1.125rem (18px)| 600 | 1.35 |
| Table / Grid Data | Sans-Serif | 0.875rem (14px)| 500 | 1.4 |
| Caption / Microcopy | Sans-Serif | 0.75rem (12px) | 500 | 1.4 |

---

## 4. Indian Financial Conventions

- **Currency Unit:** Indian Rupee (`₹` / `INR`).
- **Grouping Format:** `12,34,567.89` (Indian numbering system: thousands, lakhs, crores).
- **Paise Precision:** Internal storage in integer minor units (paise: `100 paise = ₹1.00`). Never binary floating point.
- **Compact Format:**
  - Values $\ge 1,00,00,000 \rightarrow$ `₹X.XX Cr`
  - Values $\ge 1,00,000 \rightarrow$ `₹X.XX L`
  - Values $\ge 1,000 \rightarrow$ `₹X.XX k`
- **Financial Year:** April 1 to March 31 (Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar).

---

## 5. Information Architecture & Navigation

```text
Global Shell
├── Desktop Navigation Rail (Left, fixed 72px / expandable to 220px)
│   ├── Logo & Brand Mark (Kosh 'कोश')
│   ├── Primary Navigation:
│   │   ├── [Home] (Financial Home & Money Weather)
│   │   ├── [Transactions] (Ledger & Quick Filter)
│   │   ├── [Budgets] (Budget Pulse & Allocations)
│   │   ├── [Accounts] (Cash Flow, Banks, Cards & Liabilities)
│   │   ├── [Analytics] (Spending DNA & Insights)
│   │   ├── [Goals] (Goal Momentum & Milestones)
│   │   ├── [Recurring] (Bills, Timeline & Calendar)
│   │   └── [Settings] (Preferences, Data Import/Export)
│   └── Bottom Actions:
│       └── User Profile / Demo Switcher
├── Top Utility Header:
│   ├── View Title & Breadcrumb
│   ├── Global Period Navigator (Previous Month | Current Month | Next Month | Custom Range)
│   ├── Quick Search Trigger (`Cmd/Ctrl + K`)
│   └── Persistent Quick Add Button ("+ Record" — Burnt Coral, Shortcut: `Q`)
└── Main Content Canvas:
    └── Render active view with fluid CSS Grid & tactile paper card elevations
```

---

## 6. Accessibility & Motion Guidelines

1. **Contrast:** All text satisfies WCAG AA minimum 4.5:1 against its background.
2. **Keyboard Navigation:** Full keyboard navigation support (Tab order, Enter/Space activation, Escape to dismiss modals, `Q` for quick expense entry).
3. **Motion Sensitivity:** Respects `prefers-reduced-motion: reduce`. When active, opacity-only fades replace slide and scale transitions.
4. **Color Independence:** No financial status is communicated solely by color. Statuses always pair color with plain-language badges, directional arrows, or icon tokens.
