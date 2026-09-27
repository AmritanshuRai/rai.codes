# rai.codes

My personal portfolio, first built in 2019 without AI using Gatsby.js. It now runs on plain HTML, CSS and JavaScript, keeping the fluid background, flying intro and animated text from the original site.

The site covers my work experience, projects and skills, with a downloadable resume and a contact form. There is no build step or runtime package dependency.

## Local setup

Use Node.js 24 or newer (`nvm use` reads `.nvmrc`), then run:

```sh
npm start
```

Open http://127.0.0.1:8001. To use a different port:

```sh
PORT=8002 npm start
```

You do not need to run `npm install`. Edit the files and reload the browser. Any static HTTP server can also serve `dist/`.

## Architecture

`dist/` is both the source of the website and the folder to publish.

| File | Purpose |
| --- | --- |
| `dist/index.html` | Page content, inline SVG icons and contact form |
| `dist/assets/styles.css` | Layout, responsive styles and CSS animations |
| `dist/assets/app.js` | Section navigation, carousels, text animation and form submission |
| `dist/assets/intro.js` | Chooses whether to show the two-second intro before the page paints |
| `dist/assets/fluid.js` | WebGL fluid simulation and GLSL shaders |
| `dist/assets/fonts/` | Local fonts and their licenses |
| `dist/assets/images/` | Images, including the original-resolution portrait |
| `dist/assets/resume.pdf` | Downloadable resume |
| `dist/sw.js` | Offline cache for the site and its assets |
| `scripts/serve.mjs` | Local preview server using Node's HTTP module |
| `tests/` | Checks for assets, preview responses and offline behavior |

Navigation switches sections within one page. Work and projects each have a carousel. The intro runs once per tab session, followed by a short fade. Fonts and the WebGL background initialize during the intro; the homepage animations begin after it finishes.

The background uses one animation loop. It pauses when the tab is hidden, during the intro, while contact is open, or when reduced motion is enabled. Changing sections cancels pending text-animation timers. Resizing releases replaced WebGL textures and framebuffers. If WebGL is unavailable, the dark background remains and the site still works.

## Contact form

The form sends a visitor's name, email and message directly to Web3Forms. It validates the fields, prevents duplicate sends and keeps the message if submission fails. A successful response means Web3Forms accepted the message; it does not confirm inbox delivery.

The `access_key` in `dist/index.html` is a public Web3Forms form identifier intended for browser use. It is not a private API secret. If you reuse this site, replace it with your own form key and update the contact address. Do not put private credentials in `dist/`. Environment files are ignored by Git, and the site does not store submissions locally.

The form requests that browsers disable autofill. Browser settings and password-manager extensions may override that preference.

## Checks

```sh
npm run check
```

This runs JavaScript syntax checks and Node's built-in tests. Before publishing, also check the intro, navigation, carousels and contact form at desktop and mobile widths. Reduced-motion mode should show the content without the animated background.

## Hosting

Publish the contents of `dist/` to a static host. There is no server application to deploy. `_redirects` maps the old `/main` URL to `/` on compatible hosts; configure `404.html` as the not-found page.

The service worker caches the site on production hosts and is disabled on localhost so edits stay visible. Bump its cache version when publishing asset changes. The contact form still needs a network connection.

If you change the domain, update `robots.txt`, `sitemap.xml` and the contact form's subject. Font and icon license notices live alongside their assets.

### Deploy to Cloudflare

Production runs on the `rai-portfolio` Cloudflare Worker at https://rai.codes and https://www.rai.codes. The Worker serves static assets; it has no Git repository connected for automatic deployments.

With Wrangler 4 installed and access to the existing Cloudflare account:

```sh
wrangler login
wrangler deploy --dry-run
wrangler deploy --keep-vars
```

`wrangler.jsonc` preserves the production domains and publishes `dist/`. Deployment credentials stay in your local Wrangler login, outside this repository. A GitHub push alone does not publish the website.

## Analytics

Cloudflare Web Analytics measures visits and page performance without analytics cookies or local storage. `app.js` loads the Cloudflare beacon only on `rai.codes` and `www.rai.codes`; local previews and the Worker preview hostname do not add it. Manual snippet installation is selected in Cloudflare to avoid duplicate injection. The beacon token is a public site identifier. The content security policy allows the Cloudflare Insights script and reporting endpoint. Manage collection in the Cloudflare dashboard under Web Analytics → rai.codes.

There is no Google Analytics or advertising tracker. The intro uses a separate session-storage flag to avoid replaying within the same tab. Section changes keep the same URL, so analytics measures page visits rather than counting each section as a separate page.
