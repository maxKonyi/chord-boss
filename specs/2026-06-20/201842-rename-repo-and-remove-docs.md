# Rename Repo and Remove Legacy Docs Runtime

## Summary

Rename the GitHub repository and published GitHub Pages site from the old Composer Piano identity to the current Chord Boss identity, then remove the obsolete static `docs/` runtime now that the Vite app is the only supported app surface.

## Approved Requirements

- Rename the GitHub repository from `ComposerPiano` to `chord-boss`.
- Update the local `origin` remote to `https://github.com/maxKonyi/chord-boss.git`.
- Keep GitHub Pages publishing through the existing workflow-based deployment.
- Publish the current Vite app at `https://maxkonyi.github.io/chord-boss/`.
- Remove the legacy CDN/Babel static runtime under `docs/` from version control.
- Keep the Vite source app, `public/` assets, tests, specs, workflow, and historical notes.
- Do not change gameplay behavior, app architecture, or UI polish as part of this cleanup.
- Commit and push the cleanup after local validation passes.

## Decisions

- The canonical project name is `Chord Boss`.
- The canonical repo slug is `chord-boss`.
- Historical specs and notes may continue to mention `ComposerPiano` and `docs/` when describing earlier project states.
- `dist/` remains a generated build output and should not be committed.

## Relevant Files and Paths

- `.github/workflows/deploy-pages.yml`: GitHub Pages deployment workflow. It derives the Vite base path from the repository name.
- `vite.config.js`: local and production base path configuration.
- `server.js`: production static server for local smoke testing against `dist/`.
- `src/`: current production React/Vite app.
- `public/`: current static assets copied into Vite builds.
- `tests/`: current project validation suite.
- `docs/`: obsolete static runtime to remove.

## Constraints

- Keep this change focused on repository identity, deployment destination, and legacy artifact removal.
- Preserve historical documentation unless it directly affects the active app or deploy path.
- Avoid adding a custom domain or changing the deployment strategy.

## Acceptance Criteria

- GitHub repository exists as `maxKonyi/chord-boss`.
- Local `origin` fetch and push URLs point to `https://github.com/maxKonyi/chord-boss.git`.
- The obsolete `docs/` runtime is removed from tracked files.
- `npm.cmd test` passes.
- `npm.cmd run build` passes.
- A local production smoke test against `server.js` serves the built app and expected static assets.
- The cleanup is committed and pushed to `main`.
- The GitHub Pages workflow completes successfully after the push.
- `https://maxkonyi.github.io/chord-boss/` returns the deployed Chord Boss app.

## Orchestrator Report

Implemented the approved cleanup in commit `d80a179`:

- Renamed the GitHub repository to `maxKonyi/chord-boss`.
- Updated local `origin` to `https://github.com/maxKonyi/chord-boss.git`.
- Removed the legacy tracked `docs/` runtime.
- Updated active source/header comments from the old Composer Piano naming to Chord Boss.
- Preserved historical notes/specs that describe earlier `docs/` and Composer Piano states.

Validation performed:

- `npm.cmd test` passed with 37 tests.
- `npm.cmd run build` passed and produced the Vite `dist/` output.
- Local `server.js` smoke test served `/`, generated JS/CSS, `gem-icon.svg`, and all referenced sound files with HTTP 200.
- Active app/config search found no remaining `Composer Piano`, `ComposerPiano`, `/ComposerPiano`, or active `docs/` path references.
- GitHub Pages workflow run `27892091270` completed successfully for build and deploy: `https://github.com/maxKonyi/chord-boss/actions/runs/27892091270`.
- Live hosted URL returned HTTP 200: `https://maxkonyi.github.io/chord-boss/`.
- Deployed JS/CSS bundle paths and public icon/audio assets returned HTTP 200.

Caveats:

- Node still emits the existing `MODULE_TYPELESS_PACKAGE_JSON` warning during tests because source modules use ESM syntax without `"type": "module"`. This was already present and is outside this cleanup scope.
- Vite still emits its existing CJS Node API deprecation warning during build. This was already present and is outside this cleanup scope.
- GitHub Pages settings still display a legacy source path value of `/docs`, but `build_type` is `workflow` and the successful workflow deployment publishes the uploaded `dist` artifact.
