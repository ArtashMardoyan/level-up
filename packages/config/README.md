# @level-up/config

Shared build/tooling presets for the Level Up monorepo, consumed by workspace apps via
`workspace:*` (no registry).

## Exports
- `@level-up/config/eslint` — the shared ESLint flat-config array (includes the Prettier rule
  settings: no semicolons, single quotes, print width 120, 2-space, no trailing commas; plus
  `perfectionist` import/object sorting and `react-hooks`/`react-refresh` rules).

## Usage (flat config)
```js
// apps/<app>/eslint.config.mjs
export { default } from '@level-up/config/eslint'
```

The preset's plugin dependencies (`@eslint/js`, `eslint-plugin-*`, `prettier`, `globals`) are
`dependencies` of this package, so consumers get them transitively — they only need `eslint` itself.

> This is the first shared package (Phase 6), proving the `workspace:*` mechanism. Add `ui`, `utils`,
> `contracts` later, when a real need appears (per MIGRATION-ROADMAP Phase 6).
