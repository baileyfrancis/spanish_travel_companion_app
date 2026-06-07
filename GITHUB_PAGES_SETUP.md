# GitHub Pages Setup

## 1. Create a GitHub Repository

1. Sign in to GitHub.
2. Select **New repository**.
3. Enter a name such as `spanish-travel-companion`.
4. Choose public or private. GitHub Pages availability for private repositories depends on your GitHub plan.
5. Create the repository.

## 2. Upload the Files

Upload every project file to the repository root:

```text
index.html
styles.css
app.js
data.js
manifest.json
service-worker.js
icon.svg
icon-192.png
icon-512.png
README.md
GITHUB_PAGES_SETUP.md
```

Commit the files to the `main` branch. Do not place them in an extra nested folder.

## 3. Enable Pages from the Main Branch Root

1. Open the repository on GitHub.
2. Select **Settings**.
3. Select **Pages** in the sidebar.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Select **Save**.

Deployment commonly takes one or two minutes. GitHub displays the final URL on the Pages settings screen:

```text
https://YOUR-USERNAME.github.io/REPOSITORY-NAME/
```

## 4. Open the Published App

Open the exact GitHub Pages URL. The trailing repository path matters. The app uses relative asset paths and supports this repository subpath.

Complete one online visit before testing offline mode. This gives the service worker time to cache the app shell.

## 5. Add to iPhone Home Screen

1. Open the published URL in Safari.
2. Tap the **Share** button.
3. Scroll and select **Add to Home Screen**.
4. Confirm the name and tap **Add**.
5. Launch the app from its new home-screen icon.

On iPhone, installation must be initiated from Safari. Other iOS browsers may not expose the same home-screen flow.

## 6. Add to Android Home Screen

1. Open the published URL in Chrome.
2. Open the browser menu.
3. Select **Install app** or **Add to Home screen**.
4. Confirm installation.
5. Launch the installed app from the home screen or app drawer.

Chrome may also display an install prompt automatically after the PWA criteria are met.

## 7. Troubleshooting

### Assets Return 404

- Confirm every required file is in the repository root.
- Preserve exact filename capitalisation.
- Open the full URL with the repository name, not only `username.github.io`.
- Avoid paths beginning with `/`; this project already uses relative paths.
- Check the repository's **Actions** tab for a failed Pages deployment.

### An Old Version Keeps Appearing

1. Change `CACHE_VERSION` in `service-worker.js`.
2. Commit and wait for Pages to redeploy.
3. Reopen the app and use the **A new version is ready** refresh banner.
4. If needed, close all installed-app windows and reopen.
5. As a final measure, clear site data for the GitHub Pages URL, then load it online again.

Export a JSON backup before clearing site data.

### Offline Mode Does Not Work

- Visit the published HTTPS page online at least once.
- Wait a few seconds, then reload once before going offline.
- Confirm the browser allows service workers and site storage.
- External learning-resource pages are not cached and still require internet.
- Service workers do not run when `index.html` is opened through a local `file://` URL. Use GitHub Pages or a localhost web server.

### Install Option Does Not Appear

- Confirm the app is being served over HTTPS.
- Check that `manifest.json` and both PNG icons load without errors.
- Reload after the first visit so the service worker controls the page.
- On iPhone, use Safari and the Share menu.
- On Android, browser wording varies between **Install app** and **Add to Home screen**.

### Progress Is Missing

Progress is local to the exact browser and site address. `http://localhost`, a GitHub Pages URL, and a custom domain each have separate storage. Restore a JSON backup from **Settings** when moving to another origin or device.
