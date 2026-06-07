# Spanish Travel Companion

Spanish Travel Companion is a mobile-first, offline-capable Progressive Web App for building practical Spanish before a long trip through Latin America. It combines a structured 364-day roadmap with daily guidance, phrase review, speaking practice, travel scenarios, progress diagnostics, and route-specific preparation.

The app uses plain HTML, CSS, and JavaScript. It has no backend, account, build process, package dependencies, analytics, or API keys.

## Features

- 52-week, 364-day learning plan across 12 monthly phases
- Paired Read2Speak eBook/workbook tracker across A1–A2, B1–B2, and C1–C2
- Complete 90-lesson Language Transfer Spanish course tracker
- Daily Read2Speak, listening, speaking, phrase review, and scenario tasks
- Linguno conjugation, listening, word-flashcard, and crossword practice woven into the weekly plan
- StudySpanish pronunciation, grammar, vocabulary, verb drills, and travel material matched to each learning phase
- Smart "What should I do now?" recommendation
- Focused 5, 15, and 30-minute session builder
- First-run setup for level, trip date, weekly time, session length, and route
- Five-minute fallback and missed-day catch-up modes
- Local hours and notes logging
- Spaced-repetition phrase deck with active English-to-Spanish recall and optional reverse prompts
- Guided Again, Hard, Good, and Easy ratings with exact schedules, same-session retry, and undo
- Overdue-first review batches with configurable sizes, retry counts, keyboard controls, and outcome summaries
- Custom phrases, a 120-phrase practical travel phrasebook, phrase management, and Anki-friendly CSV export
- Speaking prompts, 1/2/5-minute timer, reflection log, and weekly minutes
- Twelve practical travel scenarios with notes and confidence tracking
- Progress, activity-date streaks, achievements, weakness detection, and monthly milestones
- Scheduled Read2Speak reviews and stale-scenario follow-up recommendations
- Listening ladder and curated free-resource links
- Regional notes for 12 Latin American countries
- Automatic final 30-day departure checklist
- System, light, and dark themes
- JSON backup and restore
- Backup timestamps and an import comparison before replacement
- Installable PWA with offline app-shell caching
- Visible offline/install readiness and offline external-link warnings

## Run Locally

Opening `index.html` directly renders the app and supports all core features except service-worker installation. Browsers only allow service workers on HTTPS or `localhost`.

For full PWA testing, serve the directory locally:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

No install or build command is required.

## Run Tests

Serve the directory, then open:

```text
http://localhost:8000/tests.html
```

The dependency-free browser tests cover settings migration defaults, activity-date streaks,
review ordering and scheduling, backup summaries, and repository-relative PWA paths.

## Deploy to GitHub Pages

1. Put all files in the root of a GitHub repository.
2. Open the repository's **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder.
5. Open the published URL after GitHub finishes deployment.

All app asset paths are relative, so repository subpaths such as `https://username.github.io/repo-name/` are supported. See [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md) for installation and troubleshooting details.

## Progress Storage

Progress is stored in browser `localStorage` under `spanishTravelCompanionState`. It remains on the current device, browser profile, and exact site origin.

The app stores:

- Settings and route countries
- Daily completion, hours, and notes
- Phrase deck and review scheduling
- Speaking logs
- Scenario confidence and notes
- Monthly milestone results
- Read2Speak course, unit, checkpoints, notes, confidence, and review dates
- Language Transfer current lesson, completion history, and lesson notes
- Final-prep completion
- Achievements

Daily checklist completion and course progression are tracked separately. Completing all five
daily steps does not automatically advance Read2Speak or Language Transfer; those course records
change when their controls in **Resources** are completed.

No data is sent to a server. Private or sensitive travel information should not be entered into notes.

## Backup and Restore

Open **Settings** and select **Export backup JSON**. Keep the downloaded file somewhere reliable.

To restore, select **Import backup JSON** and choose a backup created by this app. Import replaces the current in-browser state with the backup. Export a current backup first if it contains progress you may need.

The phrase deck can also be exported separately as CSV for Anki or spreadsheet use.

## Updating the Offline App

The service worker uses a versioned cache in `service-worker.js`. When deploying changed app files:

1. Change `CACHE_VERSION` to a new value, such as `spanish-travel-v9`.
2. Commit and deploy.
3. Reopen the app. A refresh banner appears after the new worker installs.

## Known Limitations

- Data does not sync automatically between devices or browsers.
- Clearing site data removes progress unless it was exported.
- External resource links require internet access.
- The app cannot provide speech recognition or pronunciation scoring without external services.
- GitHub Pages must finish a first online load before offline use is available.
- Read2Speak content is referenced through course metadata and generic workflows; copyrighted textbook text is not included.
- Licensed Read2Speak PDFs must be selected again after reopening the app because local files are never uploaded or stored by the PWA.

## Read2Speak PDFs

The course workspace follows the recommended sequence: study the matching eBook unit, complete all 25 workbook exercises in order, check the answer key, then review and retry weak work.

Licensed PDFs remain on the learner's device. Select the eBook and workbook in **Resources > Read2Speak course workspace** to open the current unit at its starting page. The files are not uploaded, placed in `localStorage`, or cached by the service worker.

Files under `data/read2speak/*.pdf` are ignored by Git and must not be published to GitHub Pages. The tracker deliberately uses the workbook as the progression authority where supplied workbook and eBook editions do not align.

## Project Files

- `index.html`: semantic app shell
- `styles.css`: responsive visual system and themes
- `data.js`: generated curriculum and static learning content
- `core.js`: shared state, review, streak, and backup helpers
- `app.js`: state, rendering, interactions, scheduling, and exports
- `tests.html`, `tests.js`: dependency-free browser test runner
- `manifest.json`: PWA metadata
- `service-worker.js`: offline app-shell cache and update handling
- `icon.svg`, `icon-192.png`, `icon-512.png`: app icons
- `GITHUB_PAGES_SETUP.md`: deployment and home-screen instructions
