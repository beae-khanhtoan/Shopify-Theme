# Shopify Theme Base Workflow

## Repository rules

- `dev` is the only branch for development, local preview, Theme Editor work, and commits during implementation.
- `main` is the stable integration branch. Do not develop directly on `main`.
- Never commit credentials, access tokens, private keys, or store secrets.
- Before any write command, verify the target store and theme; never publish or overwrite the live theme.

## Shopify mapping

- Git `dev` maps to the development theme used for preview and Theme Editor work.
- Git `main` maps to the stable theme after `dev` has passed checks and preview QA.
- Store: `layouthub-khanhnguyen.myshopify.com`.

## Development workflow

1. Work from `dev`.
2. Run Theme Check and inspect the local preview.
3. Use `shopify theme dev --store layouthub-khanhnguyen.myshopify.com` for local, editor, and preview links.
4. Push only the verified `dev` state to the development/draft theme.
5. Promote to `main` only after review and successful verification.

## Release gate

- Confirm the store domain and theme ID before upload.
- Confirm `git status` is clean before promotion.
- Confirm `dev` and `main` point to the intended commit after promotion.
