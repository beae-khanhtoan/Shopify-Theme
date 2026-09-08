# Block Contract layer

This directory is build-time metadata for the Shopify theme. Shopify does not
read these files as Theme Editor schema.

- `settings-modules.json` is the canonical catalogue of shared capabilities.
- `block-registry.json` is the source of truth for taxonomy, ownership,
  allowed children, depth policy and render paths.
- Theme Block `{% schema %}` stays inside each `blocks/*.liquid` file and only
  contains Shopify-supported editor settings, blocks and presets.

The implementation flow is:

```text
Registry → Contract → Shopify schema → Liquid render → Section integration → QA
```

Internal metadata such as category, capability, owner, state owner and depth
policy must remain in this directory. It must not be exposed as merchant
settings or invented Shopify schema properties.
