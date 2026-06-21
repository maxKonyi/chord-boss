# GitHub Pages Deployment

## Summary

Add GitHub Pages deployment support for the Vite-based Composer Piano Trainer app, now branded as Chord Boss. This stage should create a CI deployment path that tests, builds, uploads, and deploys the Vite `dist/` output to GitHub Pages.

The authoritative decision-map spec is:

- `specs/2026-06-19/160159-modernization-refactor-decision-map.md`

Completed prior stages:

- `specs/2026-06-19/171834-stage-1-correctness-baseline.md`
- `specs/2026-06-20/115232-stage-2-static-module-boundaries.md`
- `specs/2026-06-20/132502-stage-3-vite-migration.md`

## Approved Scope

In scope:

- Add a GitHub Actions workflow for GitHub Pages deployment.
- Workflow should install dependencies, run tests, build, upload `dist/`, and deploy to Pages.
- Configure Vite base-path handling for GitHub Pages project hosting while preserving local build/dev ergonomics.
- Use Chord Boss as the product/project-facing name where relevant to package metadata and page title.
- Keep local `npm.cmd test` and `npm.cmd run build` passing.
- Do not commit generated `dist/` unless a clear technical reason appears.

Out of scope:

- Custom domain setup.
- GitHub repository creation or remote configuration.
- GitHub Pages settings changes that must be clicked in GitHub UI.
- Gameplay changes.
- UI redesign.
- Browser/MIDI automation.

## Repository And Product Naming Decision

The product/project name is Chord Boss.

Preferred naming updates:

- Package name should be npm-safe, e.g. `chord-boss`.
- Browser title should use `Chord Boss`.
- GitHub Pages base path should not hard-code an assumed repo slug unless necessary.

Preferred base-path approach:

- Local builds should continue to work with relative/static-safe paths.
- GitHub Actions should provide a repository-derived base path during the Pages build, usually `/${{ github.event.repository.name }}/`.
- Vite config should read that value from an environment variable such as `VITE_BASE_PATH`, with a safe local fallback.

## Relevant Current Files

- `package.json`: scripts, package metadata, dependencies.
- `package-lock.json`: dependency lockfile.
- `vite.config.js`: Vite config and current static-hosting base.
- `index.html`: Vite HTML entry/title.
- `server.js`: serves built `dist/` locally.
- `src/`: production app source.
- `public/`: static assets copied into build output.
- `tests/run-tests.js`: Node test suite.

Expected new file:

- `.github/workflows/deploy-pages.yml` or similarly named workflow file.

## GitHub Pages Workflow Requirements

The workflow should:

- Run on pushes to the main branch.
- Allow manual dispatch with `workflow_dispatch`.
- Use official GitHub Pages Actions where practical:
  - `actions/checkout`
  - `actions/setup-node`
  - `actions/configure-pages`
  - `actions/upload-pages-artifact`
  - `actions/deploy-pages`
- Use appropriate permissions for Pages deployment:
  - `contents: read`
  - `pages: write`
  - `id-token: write`
- Use `npm ci`.
- Run tests before build.
- Build the app.
- Upload `dist/`.
- Deploy using the `github-pages` environment.

## Behavior To Preserve

- Stage 1, Stage 2, and Stage 3 tests continue to pass.
- Vite production build continues to pass.
- Built app remains static-hosting-compatible.
- `server.js` continues to serve `dist/` locally.
- Existing UI/game behavior is unchanged.

## Implementation Constraints

- Do not add GitHub workflow secrets unless required.
- Do not add custom domain files such as `CNAME`.
- Do not add generated `dist/` to source unless needed and justified.
- Do not change gameplay or redesign UI.
- Keep the workflow focused and conventional.
- Do not add plan/spec references or future-work notes in production comments, workflow names, test names, or identifiers.
- Do not revert unrelated dirty worktree changes.

## Acceptance Criteria

- GitHub Pages workflow exists and follows the requirements above.
- Vite config supports GitHub Pages project base path via environment/config while preserving local builds.
- Chord Boss name is reflected in package/page metadata where appropriate.
- `npm.cmd test` passes.
- `npm.cmd run build` passes locally.
- A local production smoke through `server.js` passes for `/`, built JS/CSS, SVG, and WAV assets.
- No generated `dist/` is committed unless explicitly justified.
- No gameplay/UI redesign is introduced.

## Expected Local Checks

- `npm.cmd test`
- `npm.cmd run build`
- Production smoke through `server.js` against built `dist/`:
  - `/`
  - built JS asset
  - built CSS asset
  - `/gem-icon.svg`
  - `/sounds/correct.wav`
  - `/sounds/wrong.wav`
  - `/sounds/life-Loss.wav`
  - `/sounds/game-Over.wav`

Optional static inspection:

- Confirm workflow YAML is parseable and uses expected Pages actions.
- Confirm `dist/` remains untracked/generated.

## Orchestrator Report

Completed: 2026-06-20

Plan file:

- `specs/2026-06-20/165249-github-pages-deployment.md`

Subagents:

- Implementer: `019ee774-001a-7f81-9043-a9e35b63e584` (`Confucius`)
- Acceptance checker: `019ee776-1e90-7da3-8519-031eb99737f9` (`Tesla`)
- Code reviewer: `019ee776-4b3b-7491-a29f-8f74ce497a96` (`Lovelace`)

Loop count:

- One implementation pass.
- Verifier pass found no meaningful in-scope workflow/base-path/naming defects.

Implementation outcome:

- Added `.github/workflows/deploy-pages.yml`.
- Updated `vite.config.js` so Vite reads `process.env.VITE_BASE_PATH || './'`.
- Configured the workflow to build with `VITE_BASE_PATH: /${{ github.event.repository.name }}/`.
- Updated package/page metadata to use `chord-boss` and `Chord Boss`.
- Expanded tests to cover deployment workflow/base-path/name expectations.

Verifier outcomes:

- Acceptance checker confirmed the workflow structure, Pages permissions, `npm ci`, test/build/deploy order, env-derived base path, Chord Boss metadata, lack of `CNAME`, and untracked generated `dist/`.
- Acceptance checker reported its own interrupted smoke and ignored `dist/` regeneration as verification artifacts, not implementation defects.
- Code reviewer found no meaningful in-scope findings.
- Code reviewer suggested a possible future stronger test that parses workflow YAML and validates a Pages-base build output.

Final local verification:

- `npm.cmd test` passed with 28 tests.
- `npm.cmd run build` passed.
- `git ls-files dist` returned no tracked files.
- Production smoke through `server.js` passed on port `18732` for `/`, built JS, built CSS, `gem-icon.svg`, and all WAV assets.

Documentation updates:

- No feature documentation under `docs/<name>/README.md` was needed.
- This orchestrator report was appended to the plan file.

Remaining caveats:

- The GitHub repository must still have Pages configured to use GitHub Actions in the GitHub UI if it is not already set.
- The workflow has not been run on GitHub yet from this local environment.
- `npm.cmd test` still prints Node's typeless ESM warning, and `npm.cmd run build` still prints Vite's CJS Node API deprecation warning; both commands pass.
- The worktree remains intentionally dirty with the staged modernization work and generated ignored `dist/` output.
