# Composer Piano Trainer - App Context Document

## App Overview
The Composer Piano Trainer is a web-based application that helps users learn and practice piano chords through an interactive interface connected to MIDI keyboards. It features a chord recognition system, customizable training options, and performance tracking.

## Core Functionality
- Interactive piano keyboard visualization with MIDI input support
- Chord training system with multiple difficulty levels
- Comprehensive chord library (triads, 6th, 7th, and 9th chords)
- Multiple inversion modes for chord practice
- Chord progression mode for practicing common chord sequences
- Performance tracking with scoring and feedback
- Preset system for quick configuration

## Technical Architecture
- Built with vanilla JavaScript and React (using Babel for in-browser JSX)
- No build step required (zero-build architecture)
- Local storage for settings persistence
- Web MIDI API for keyboard connectivity

## File Structure

### Core Files
| File | Purpose |
|------|---------|
| `index.html` | Main HTML structure, loads all resources |
| `app.js` | Main application component, MIDI handling, keyboard component |
| `chord-trainer.js` | Core chord training functionality and game logic |
| `sidebar.js` | Settings interface and preset selection |
| `music-theory.js` | Music theory utilities and chord generation |
| `presets.js` | Predefined training configurations |
| `scoreGems.js` | Performance rating system |

### Styling Files
| File | Purpose |
|------|---------|
| `style.css` | Base application styling |
| `keyboard.css` | Piano keyboard styling |
| `trainer.css` | Chord trainer interface styling |
| `sidebar.css` | Settings sidebar styling |
| `gem-rating.css` | Performance gems styling |

## Component Hierarchy
- `App` (app.js)
  - `TrainerLayout`
    - `ChordTrainer` (chord-trainer.js)
      - `Sidebar` (sidebar.js)
        - `HelpModal`
        - `PresetSelector`
      - `PianoKeyboard`
      - `Timer`
      - `LivesDisplay`
      - `GameSummary`

## Key Features in Detail

### Piano Keyboard
- Visual representation of a piano keyboard
- Shows active notes when played on MIDI device
- Dark/light mode toggle
- Only C notes labeled for clean appearance
- Custom styling preferences:
  - No dark container (floating appearance)
  - No pulsing blue glow effect
  - No ripple effect on key press
  - Dark mode with dark gray keys
  - Purple highlights for active keys in dark mode

### Chord Training System
- Displays chord names for users to play
- Validates played chords against expected chords
- Provides immediate feedback
- Tracks score, streak, and accuracy
- Lives system (3 lives per session)
- Sound effects for correct/incorrect answers

### Difficulty Levels
- Practice mode: Unlimited time
- Easy: 12 seconds per chord
- Medium: 6 seconds per chord
- Hard: 3 seconds per chord

### Inversion Modes
- Root Only: Chords must be played in root position
- Inversions: Specific inversions must be played as requested
- Free: Any inversion of the chord is accepted

### Chord Library
- **Triads**: Major, Minor, Diminished, Augmented, Sus2, Sus4
- **6th Chords**: Major 6th, Minor 6th
- **7th Chords**: Dominant 7th, Major 7th, Minor 7th, Diminished 7th, Half-Diminished 7th, Minor-Major 7th
- **9th Chords**: Major 9th, Minor 9th, Dominant 9th, 6(9), m6(9)

### Preset System
- Organized by difficulty level:
  - Beginner: Basic triads and simple inversions
  - Intermediate: 6th and 7th chords
  - Advanced: All chord types with inversions, 9th chords

### Performance Tracking
- Streak counting for consecutive correct answers
- Gem rating system (0-5 gems based on accuracy)
- Game summary with detailed statistics
- High score tracking

## Data Flow
1. MIDI input is received from connected keyboard
2. Active notes are tracked in the App component state
3. ChordTrainer component generates chord challenges
4. User plays chord on MIDI keyboard
5. Played notes are validated against expected chord
6. Feedback is provided and score is updated
7. Process repeats for configured number of questions
8. Performance summary is displayed at the end

## Settings and Configuration
- Question count: 5, 10, 15, or 20 questions per session
- Difficulty: Practice, Easy, Medium, or Hard
- Inversion mode: Root Only, Inversions, or Free
- Question delay: 0-3 seconds between questions
- Chord type selection: Customizable selection of chord types
- MIDI input selection: Choose specific MIDI device or all inputs

## User Interface Elements
- Piano keyboard with active note highlighting
- Chord display showing current chord to play
- Timer bar with color changes based on remaining time
- Lives display showing remaining attempts
- Settings sidebar for configuration
- Preset selector for quick setup
- Help modal with instructions
- Game summary with performance statistics

## Special Considerations
- Sus2 and Sus4 chords are not inverted (similar to augmented chords)
- Dark mode styling applies only to the keyboard, not score symbols
- The app saves user preferences and settings in localStorage

## Chord Progression Mode
The app features a dedicated chord progression mode that allows users to practice sequences of chords rather than individual chords:

- **Progression Categories**: Organized into Simple, Intermediate, and Complex categories
- **Progression Types**: 
  - Triads in Major Key
  - Triads in Minor Key
  - Triads with Mixed qualities
  - Sevenths progressions in Major and Minor keys
  - Jazz Standards progressions
  - Extended chord progressions
- **Key Selection**: Practice progressions in fixed or random keys
- **Inversion Modes**: Three options for handling chord inversions in progressions:
  - Root Only: All chords must be played in root position
  - Inversions: Specific inversions must be played as indicated
  - Free: Any inversion of the correct chord is accepted
- **Special Handling**: Sus2 and Sus4 chords are never inverted, similar to augmented chords
- **UI Integration**: Dedicated tab in the sidebar with progression-specific controls
- **Fallback Mechanism**: Gracefully falls back to single chord mode if progression data is invalid

## Technical Implementation Notes
- Uses React's useState and useEffect hooks for state management
- MIDI handling through the Web MIDI API
- Chord validation with music theory rules
- Local storage for persistent settings
