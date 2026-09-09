# Shopify Theme Base Workflow

## Repository rules

- `dev` is the only branch for development, local preview, Theme Editor work, and commits during implementation.
- `main` is the stable integration branch. Do not develop directly on `main`.
- Always run `git branch --show-current` and `git status` before editing or running a remote write command.
- If `main` has commits that are not in `dev`, merge `main` into `dev`, resolve conflicts, and re-run all checks before continuing.
- Never commit credentials, access tokens, private keys, or store secrets.
- Before any write command, verify the target store and theme; never publish or overwrite the live theme.

## Shopify mapping

- Git `dev` maps to the development theme used for preview and Theme Editor work.
- Git `main` maps to the stable theme after `dev` has passed checks and preview QA.
- Store: `layouthub-khanhnguyen.myshopify.com`.
- Stable theme (`main`): `theme/main` — theme ID `164351607026`.
- Development/draft theme (`dev`): `theme/dev` — theme ID `165661769970`.

## Development workflow

1. Start from the repository root on `dev`; check branch and working tree.
2. If `main` moved, merge `origin/main` into `dev` before coding.
3. Run `shopify theme check`, inspect `git diff`, and use `shopify theme dev --store layouthub-khanhnguyen.myshopify.com --theme 165661769970`.
4. Verify local preview, Theme Editor preview, responsive behavior, and the shareable preview link.
5. Commit clearly on `dev`, then push `dev` and upload only to theme ID `165661769970`.
6. Promote to `main` only after review; do not publish a live theme as part of this workflow.

## Release gate

- Confirm the store domain and theme ID before upload.
- Confirm `git status` is clean before promotion.
- Confirm `shopify theme check` passes and the preview/editor links render the intended commit.
- Confirm `dev` and `main` point to the intended commit after promotion with `git rev-parse dev main`.
- If main is promoted, upload to theme ID `164351607026` only after explicit release approval.
