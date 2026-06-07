# Repository Guidelines

## Product Purpose

Spanish Travel Companion is a mobile-first language-learning companion for practical travel in Latin America. It should guide daily study, make the next action obvious, and help learners build language they can retrieve in real travel situations.

## Technology

- Use vanilla HTML, CSS, and JavaScript.
- Do not add a backend, database, login, or API-key requirement.
- Do not introduce a build step or external dependencies.
- Keep the app usable by opening `index.html` directly, except for features such as service workers that require HTTPS or localhost.

## Hosting

The app is hosted on GitHub Pages and may be published under a repository subpath.

- Use relative asset and navigation paths.
- Do not use root-relative paths such as `/app.js`.
- Keep the PWA manifest, service worker scope, icons, and cached assets compatible with GitHub Pages subpaths.

## Storage

- Store user settings and progress in `localStorage` only.
- Do not send user data to external services.
- Preserve compatibility with JSON backup and restore.
- Treat changes to persisted state structures as migrations: provide defaults for older saved data and avoid silently discarding progress.

## Design Principles

- Design mobile-first, with comfortable one-handed controls and tap targets.
- Keep the interface calm, practical, and low-friction.
- Make the daily workflow and primary action immediately clear.
- Use accessible semantic HTML, readable text, strong contrast, visible focus states, and keyboard-friendly controls.
- Do not rely on colour alone to communicate state.
- Respect reduced-motion and light, dark, and system themes.
- Avoid clutter, childish language, and unnecessary interaction steps.

## Learning Principles

- Prioritise Spanish that is useful during Latin America travel.
- Reinforce useful phrases through spaced repetition.
- Encourage frequent speaking activation and retrieval practice.
- Build listening ability through progressive comprehensible input.
- Integrate Language Transfer and other free resources purposefully rather than treating links as a curriculum.
- Refer to Read2Speak units and workflows generically.
- Do not reproduce copyrighted Read2Speak passages, exercises, or substantial textbook content.
- Prefer complete, reusable phrases and realistic scenarios over isolated vocabulary.

## Code Style

- Use modular, focused functions with clear names.
- Keep state changes explicit and derived statistics computed from source records where practical.
- Follow existing patterns in `app.js`, `data.js`, and `styles.css`.
- Escape user-provided text before rendering it as HTML.
- Add comments only where logic is not self-explanatory.
- Do not add external packages, frameworks, generated bundles, or package-manager files.
- Keep unrelated refactors out of focused changes.

## Testing Expectations

Before considering a change complete:

1. Run the app through a local static web server.
2. Test at a phone-sized viewport and check one-handed usability.
3. Check the browser console for errors during normal use.
4. Verify all changed asset paths work from a GitHub Pages-style subpath.
5. Test offline behaviour after one successful online load.
6. Confirm daily progress and settings survive a refresh.
7. Export a JSON backup, change progress, restore the backup, and verify the restored state.
8. Exercise any affected feature, including phrase review, speaking logs, scenarios, milestones, or CSV export.
9. Validate `manifest.json` and confirm required PWA assets return successfully.
