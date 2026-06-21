# UI Refresh: Charcoal, Pumpkin, and Teal Decision Map

## Context

The current Chord Boss UI works functionally, but the settings menu reads as busy and visually inconsistent. The screenshot shows a wide fixed sidebar full of compact controls, dense chord toggle grids, repeated borders, purple gradients, and mixed button/select treatments. A code inspection confirms that the visual noise is not only aesthetic: `src/Sidebar.jsx` contains many inline styles, while `src/styles/sidebar.css` and `src/styles/trainer.css` both define overlapping rules for `.sidebar`, `.settings-group`, `.chord-family-*`, `.chord-type-toggle`, buttons, selects, and preset UI.

The redesign should keep the current app structure and core behavior intact while making the interface clearer, flatter, and more refined. The sidebar remains the main target, with a light pass over the center trainer area so the whole screen feels like one product.

## Goals

- Make the settings menu easier to scan and understand.
- Reduce visual clutter by improving grouping, hierarchy, spacing, and control consistency.
- Move away from the current glossy purple-gradient style.
- Establish a flat, modern dark theme using charcoal surfaces, pumpkin accents, and occasional teal highlights.
- Keep the existing sidebar width.
- Make chord category sections collapsible.
- Move lower-frequency toggles into an Advanced section.
- Leave the preset selector behavior as-is for now.
- Lightly restyle the center trainer controls, question display, timer, feedback, and buttons so they align with the updated visual system.

## Non-Goals

- Do not redesign the preset selector interaction in this pass.
- Do not change training logic, scoring, chord validation, MIDI behavior, localStorage setting semantics, or preset data.
- Do not change the piano keyboard behavior unless small color adjustments are needed for theme coherence.
- Do not introduce a large component library or new dependency just for styling.
- Do not shrink the sidebar from its current `450px` width.

## Decisions

### Overall Style Direction

Use a flat, minimalist dark interface:

- Base background: near-black charcoal.
- Sidebar and panels: layered charcoal surfaces with subtle borders.
- Primary action/accent: pumpkin orange.
- Secondary/focus/accent detail: teal.
- Text: warm off-white for primary text, muted gray for secondary text.
- Avoid purple as a core theme color.
- Remove glossy gradients, heavy shadows, and high-contrast bevel-like borders from primary controls.

Suggested token direction:

```css
:root {
  --color-bg: #0b0d0e;
  --color-sidebar: #131617;
  --color-surface: #191d1f;
  --color-surface-muted: #202527;
  --color-border: #2a3033;
  --color-text: #f2eee8;
  --color-text-muted: #a9ada8;
  --color-pumpkin: #d8792c;
  --color-pumpkin-hover: #ef8c3a;
  --color-teal: #3eb7a7;
  --color-danger: #d95b4f;
}
```

Exact color values can shift during implementation, but the final palette should clearly read as charcoal/pumpkin with restrained teal, not purple.

### Sidebar Width and Layout

Keep the current fixed sidebar width at `450px`.

Use the width more intentionally:

- Preserve generous horizontal room for labels and controls.
- Add clearer vertical sections.
- Use fewer competing borders.
- Replace many tiny inline layouts with reusable CSS classes.
- Let section headers carry hierarchy instead of every individual block feeling boxed.

The sidebar should still support scrolling and should remain usable on the existing responsive breakpoint.

### Settings Hierarchy

Recommended sidebar order:

1. Header: app/settings title plus Help.
2. MIDI input.
3. Preset selector, unchanged in behavior.
4. Session settings.
5. Mode tabs: Qualities / Progressions.
6. Chord or progression selection.
7. Advanced.

The Session section should use plain labels and consistent control sizing rather than abbreviated, cramped controls where possible. `Q`, `Diff`, and `Inv` can become clearer labels such as `Questions`, `Difficulty`, and `Inversions` if space allows. The delay slider should become a standard styled range control or a cleaner reusable control rather than the current inline custom div/thumb implementation.

### Collapsible Chord Groups

Chord families should become collapsible sections. Closed sections should communicate selection state so the user does not need to expand every group to understand the session.

Preferred header pattern:

```text
Triads          2 selected     chevron
7th Chords      All            chevron
9th Chords      None           chevron
```

Each group should support:

- Expand/collapse.
- A visible selected count or `All`/`None` summary.
- A select-all checkbox or compact group action.
- Flat pill/toggle buttons inside the expanded area.

Default expanded state can remain simple:

- Expand the first active/selected group, or
- Expand common groups such as Triads by default and collapse others.

Implementation can choose the simpler state model, but it should avoid hiding all controls without any summary.

### Advanced Section

Move low-frequency settings into an Advanced section:

- `Make 5th Optional for 7th+ chords`
- `Mute audio`

The section should be visually quieter than primary settings. It can be collapsed by default if the implementation adds a small reusable disclosure pattern. If that adds too much state for the first pass, it can be a subdued section at the bottom labeled `Advanced`.

### Preset Selector

Leave the current pop-out behavior intact for now.

The implementation may restyle the button and pop-out to match the new flat theme, but should not change its interaction model, position strategy, or collection/preset behavior unless needed to fix obvious styling inconsistencies.

### Center Trainer Area

Apply a light restyle to make the center feel coherent with the sidebar:

- Question display: flat charcoal surface, subtle border, no purple gradient.
- Timer: flatter track, pumpkin/teal status colors if appropriate.
- Lives/score: cleaner spacing and color hierarchy.
- Buttons: consistent flat primary/secondary/danger styles.
- Feedback message: flat status surfaces rather than gradient purple shell.

The center should remain focused on the chord prompt and keyboard, with no large new explanatory text or landing-page treatment.

### Buttons, Selects, Inputs, Toggles

Shared controls should be made consistent across sidebar and trainer:

- Define base styles once for buttons, selects, inputs, and range controls.
- Avoid broad global `button` rules that accidentally restyle all app buttons in conflicting ways.
- Prefer semantic classes such as `.button`, `.button-primary`, `.button-secondary`, `.button-danger`, `.form-select`, `.chip-toggle`.
- Keep controls flat with subtle hover/focus states.
- Use teal primarily for focus rings, active outlines, and small highlights.
- Use pumpkin for primary active selections and the main call to action.

### CSS Organization

The current import order is:

```js
import './styles/style.css';
import './styles/keyboard.css';
import './styles/trainer.css';
import './styles/sidebar.css';
import './styles/gem-rating.css';
```

This means later files override earlier ones. The refresh should account for this deliberately.

Recommended direction:

- Put theme tokens and base typography/background in `src/styles/style.css`.
- Keep trainer layout and center-area styling in `src/styles/trainer.css`.
- Keep sidebar-specific layout and chord selection styling in `src/styles/sidebar.css`.
- Remove or reduce duplicate `.sidebar`, `.settings-group`, `.preset-*`, `.chord-family-*`, `.chord-type-toggle`, `button`, and `select` definitions across files.
- Move inline styles out of `src/Sidebar.jsx` where practical, especially in Session controls, MIDI input, chord groups, progression groups, options, and preset pop-out styling.

The implementation does not need a full CSS architecture migration, but it should end with a clearer ownership boundary than the current overlapping rules.

## Relevant Code Paths

- `src/Sidebar.jsx`
  - Main target for markup cleanup, section hierarchy, collapsible chord groups, Advanced section, and removal of inline styles.
  - Contains `HelpModal`, `Sidebar`, and `PresetSelector`.
- `src/styles/sidebar.css`
  - Main target for sidebar visual language, chord selection styling, tabs, MIDI/session groups, Advanced, and preset styling overrides.
- `src/styles/trainer.css`
  - Target for center trainer area, question display, timer, feedback, controls, and shared styles that currently overlap sidebar styles.
- `src/styles/style.css`
  - Target for theme tokens, app background, and base typography/control defaults.
- `src/main.jsx`
  - Import order matters; likely no functional change required.
- `src/components/trainer/SessionControls.jsx`
  - May need button class names for primary/secondary/danger states.
- `src/components/trainer/QuestionDisplay.jsx`
  - Likely no logic change; styling-only.
- `src/components/trainer/TimerBar.jsx`, `LivesDisplay.jsx`, `ProgressionDisplay.jsx`, `GameSummary.jsx`
  - Possible class/style alignment for the refreshed center UI.
- `src/App.jsx`
  - Contains `PianoKeyboard` and some layout wrappers with inline styles. Only light alignment is expected unless existing inline styles interfere with the refresh.

## Product Behavior Notes

- Collapsible sections should not change which chord types are selected. Collapse state is presentation only.
- Selecting chord chips should continue to update `settings.chordTypes`.
- Selecting progression chips should continue to update `settings.selectedProgressions`.
- Qualities/Progressions tabs should retain current behavior.
- Preset selection should continue to call `handleSelectPreset`.
- Existing localStorage persistence through `updateSettings` and `TrainerSettings` should be preserved.

## Options Considered

### Keep All Chord Groups Open

Pros:

- Lowest implementation effort.
- Existing behavior remains visually accessible.

Cons:

- Does not solve the core density problem.
- Continues to make the sidebar feel long and busy.

Decision: Do not keep all groups always open. Use collapsible groups.

### Redesign Preset Selector Now

Pros:

- Could make the top of the sidebar calmer.
- Could remove fixed-position pop-out complexity.

Cons:

- User explicitly prefers leaving it as-is for now.
- It expands scope and risks changing a working workflow.

Decision: Keep behavior as-is; restyle only if needed.

### Full App Redesign

Pros:

- Maximum visual coherence.

Cons:

- Higher risk of touching unrelated behavior.
- The user’s strongest pain point is the menu.

Decision: Prioritize sidebar. Apply a light center refresh for cohesion.

### Replace CSS With New Styling System

Pros:

- Could make future design work more systematic.

Cons:

- Too broad for this UI-improvement pass.
- Current app is small enough to improve with targeted CSS and markup cleanup.

Decision: Use existing CSS files with clearer ownership and shared tokens.

## Risks

- Collapsible group state could accidentally make selected options less discoverable if summaries are weak.
- Moving inline styles into CSS may reveal cascade conflicts from duplicated selectors.
- Broad global button/select rules could unintentionally affect keyboard controls, modals, or preset items.
- The pumpkin/teal palette could become too saturated if used on every control. Pumpkin should signal primary/selected; teal should be occasional and intentional.
- Center-area restyling should not reduce prompt readability or keyboard focus.

## Open Implementation Questions

- Should collapsible chord groups remember open/closed state in localStorage, or reset per page load? The simpler first pass can keep this local component state only.
- Should active selected chord chips use filled pumpkin, or a charcoal chip with pumpkin border/text? The final choice should be made visually during implementation.
- Should the Advanced section be collapsed by default? Recommended: yes, if a reusable disclosure pattern is already being added for chord groups.
- Should the MIDI status/error states get their own refreshed treatments in this pass? Recommended: yes for visual consistency, without changing Web MIDI behavior.

## Suggested Implementation Slices

1. Establish theme tokens and remove purple-gradient base styling.
2. Refactor sidebar markup to use named classes for MIDI, Session, tabs, chord groups, and Advanced.
3. Add collapsible chord/progression group presentation with selection summaries.
4. Restyle shared controls, chips, selects, and buttons with charcoal/pumpkin/teal language.
5. Lightly refresh center trainer panels, controls, timer, feedback, and score.
6. Sweep duplicate CSS selectors and reduce inline styles where practical.

