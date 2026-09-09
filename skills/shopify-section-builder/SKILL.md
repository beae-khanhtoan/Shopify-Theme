---
name: shopify-section-builder
description: "Build or refactor Shopify theme sections from a brief using the repository's Theme Settings, Block Registry, Section Infrastructure, Theme Editor lifecycle, responsive and release-gate standards."
---

# Shopify Section Builder

Use this skill for any new section, section refactor, section placement, section schema, or section-level QA task. It governs sections; it does not replace the Block System or change global Theme Settings without an explicit request.

## Preconditions

1. Read the repository `AGENTS.md` and confirm the current branch/worktree and target store/theme before any write or remote command.
2. Read the relevant Theme Settings/Foundation contracts, `contracts/block-registry.json`, existing Block Contracts, and the section placement rules already in the repository.
3. Require a section brief containing: purpose, role, placement, data context, conversion/content goal, expected blocks, and required interactions.

If placement, data context, ownership, or allowed blocks are missing, stop at a Section Build Plan. Do not invent markup or schema to fill the gap.

## Ownership model

- Theme Settings owns global tokens: colors, typography, spacing, radius, motion and shared interaction rules.
- The section owns placement, resource boundary, outer container/width, section spacing, background/layer when contracted, outer layout and block slots.
- A block owns content and internal layout/appearance/behavior allowed by its Block Contract. It must not own page placement, section spacing, parent grid columns, card width or parent gap.
- Template/section group owns section order and surface composition.
- Shopify owns resource context, localization, market-aware money, and app-block context.
- CSS Foundation owns tokens, reset, semantic utilities and shared section primitives. Section CSS owns only scoped section presentation; never fork core block styles.

## Required workflow

### 1. Build Plan and routing

Create a reviewable plan before code:

- identity, role, owner and supported template/group surface;
- resource context and data flow;
- placement type: dynamic JSON template, main/resource section, section group, or static;
- section-level settings and their token/consumer mapping;
- slots, allowed block types, limits, default order, app-block policy and empty state;
- Liquid render path, CSS/JS needs, responsive states, lifecycle and QA cases.

Route work by responsibility:

`brief → check Block Registry → section schema/composer → Liquid/CSS/JS implementation → responsive/editor guard → QA/release gate`

If a required block is missing, route back to the Block System. Do not create an ad-hoc block inside the section.

### 2. Contract and placement

Define a concise Section Contract with:

- Identity, Context, Presentation, Children, Runtime, Output and Constraints.
- Placement matrix: surface, addability, reorder/remove behavior, resource context and app-block support.
- Main/resource sections restricted to their resource template; content sections must not guess product, collection, cart or other context.
- Dynamic sections require preset and placement guard. Use exactly one of `enabled_on` or `disabled_on`.
- Section groups render through the appropriate group contract. Static sections are exceptions only when merchant add/remove/reorder is not needed.

### 3. Schema and block composition

Schema is the merchant editor surface, not a CSS dump. Define only settings the section truly owns:

- identity/core, common layout/appearance, then narrowly scoped specialized controls;
- valid `name`, `tag`, `class`, `settings`, `blocks`, `presets`, placement guard, limits and localization;
- explicit block allow-list derived from the Registry, slot purpose, capacity, default composition and nesting depth;
- app blocks only where width, spacing, context, fallback and QA are specified;
- every setting has ID, type, values where applicable, default, owner/consumer mapping, constraint and `visible_if` when needed;
- use semantic/token options instead of exposing arbitrary per-side CSS controls or duplicating global tokens;
- preserve merchant comprehension: labels describe design intent, not implementation jargon.

Capacity limits must remain within Shopify limits: at most 25 sections in a JSON template and 50 blocks in a section.

### 4. Liquid, shell and CSS

- Build the semantic shell first; separate full-bleed/background from the inner content container.
- Use stable root classes/data attributes and section-scoped custom properties for settings.
- Render blocks in Shopify's configured order; root block elements always include `{{ block.shopify_attributes }}`.
- Never use `section.shopify_attributes` and never drive logic from literal block IDs.
- Resolve empty, unavailable, loading and error states before styling the happy path.
- Reuse Foundation tokens and existing block assets. Parent owns outer grid, columns, card width and gap; blocks own internal layout.
- Ensure long content, translated content, missing blocks, font zoom and empty slots do not overflow.
- Custom CSS is an escape hatch scoped to the current section; it must not override Foundation tokens, DOM contracts or accessibility states.

### 5. JavaScript and Theme Editor lifecycle

Add JavaScript only for real runtime interaction and progressively enhance where possible.

- Scope every query, event and state to one section instance.
- Make `init` idempotent and provide cleanup/destroy; never leak global state or duplicate listeners.
- Handle `shopify:section:load`, `shopify:section:unload`, `shopify:section:select`, `shopify:section:deselect`, and block select/deselect when relevant.
- Preserve focus, state and accessibility after add/remove/duplicate/reorder/save/reload.
- Model async state explicitly: idle, loading/changing, success and error.
- Do not let one section instance affect another.

### 6. Responsive and QA release gate

Test the contract, not just the initial screenshot:

- desktop/tablet/mobile width, alignment, stacking, order, visibility, overflow, ratio/crop and touch targets;
- one responsive DOM tree by default; split trees only when content/order genuinely differs;
- block responsive behavior inherits from the parent unless its contract explicitly allows an override;
- Theme Editor Add, Remove, Duplicate, Reorder, Save, Reload, section/block select/deselect, preset, limits, app fallback and empty state;
- storefront empty/long/missing/translated content, interactions, loading/error and no-JS fallback;
- semantic landmarks, heading order, labels, keyboard/focus, contrast and reduced motion;
- no layout shift, stale class/state or duplicate listener.

Release only when all three gates pass:

1. Schema/contract and placement are valid.
2. Storefront and Theme Editor behavior are valid.
3. Runtime, responsive and accessibility behavior are valid.

Record every exception with evidence, owner and severity. Do not use an unverified section as the base for a catalogue.

## Output contract

Return or save:

- Section Build Plan and owner map;
- file/render/schema map, block-slot matrix and data flow;
- implemented section and any scoped JS/CSS dependencies;
- machine-readable QA checklist with `pass`, `fail`, `owner`, `evidence` and `release` fields;
- validation results and remaining limitations.

## Machine-readable checklist

```yaml
section:
  contract: pass|fail
  placement: pass|fail
  schema: pass|fail
  block_slots: pass|fail
  storefront: pass|fail
  theme_editor: pass|fail
  responsive: pass|fail
  accessibility: pass|fail
  runtime_lifecycle: pass|fail
  release: pass|fail
```

## Boundaries

- `shopify-block-system`: create/fix Block Kernel, Block Contract, Settings Module or Registry.
- `shopify-section-schema`: focused schema audit or design when the section builder should not implement UI.
- `shopify-section-builder`: section composition and Liquid/CSS/JS implementation.
- `section-editor-standards`: final architecture, editor, responsive, accessibility and release audit.

All section decisions must be traceable to the Foundation/Theme Settings, Block System, Section Infrastructure or Global UI contract. Global UI is read as a dependency when integrated; it is not modified as a side effect.
