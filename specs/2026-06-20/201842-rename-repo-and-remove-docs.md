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
