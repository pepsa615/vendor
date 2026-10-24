# Pepsa UI Kit

Governance version: `2026.10.14-m0`

Import components from `src/components/ui/index.ts`. Feature code must not reproduce an available control with raw markup or local Tailwind recipes.

## Foundations

- Primary brand: Pepsa red (`brand-600` / `#991b1b`) with documented light and dark steps.
- Semantic tones: `brand`, `neutral`, `success`, `warning`, `danger`, and `info` where relevant.
- Component sizes: `sm`, `md`, and `lg`; medium is the default.
- Icons: Lucide through `Icon`; asynchronous icon/loading state through `IconLoader`.
- Accessibility behavior: React Aria or native semantics, visible keyboard focus, labelled icon controls, focus-managed overlays, and reduced-motion support.

## Catalog

- Actions: `Button`, `ButtonGroup`, `Dropdown`.
- Data entry: `SearchInput`, `Switch`, `Checkbox`, `Select`, `ListBox`, `TagGroup`, `Chip`, `DateField`, `DatePicker`, `Calendar`.
- Navigation/disclosure: `Tabs`, `Accordion`.
- Data display: `Table`, `Card`, `Badge`, `Pill`, `Avatar`, `Icon`.
- Loading: `Skeleton`, `SkeletonText`, `IconLoader`, and button `loading` state.
- Feedback/overlays: `Alert`, `AlertDialog`, `Modal`, `Drawer`, `Popover`, `Toast`, and `Tooltip`.

Review all components and states at `/ui-kit`. Extend the component, tests, catalog example, and semantic token set together when Figma or a product feature introduces a genuine missing variant. Never place business rules, API calls, permissions, or domain state transitions inside this directory.
