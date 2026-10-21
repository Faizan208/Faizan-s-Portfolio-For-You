# FAIZAN — Behind the Screen / About page

Built for the existing three-page portfolio: `index.html`, `about.html`, `project-inquiry.html`.
Only HTML, CSS, and plain JavaScript; no frameworks or extra images required.

## Safe installation (preserves current homepage + encrypted voice note)

1. In VS Code, make a new feature branch from your updated local `main` (after checking `git status`):

   git switch -c about-page

2. Extract the ZIP **into the existing `faizan-portfolio` directory that contains `index.html`**.
   This ZIP contains only NEW files, so do not remove or replace existing website files.

3. From the `faizan-portfolio` directory, run:

   node tools/install-about-menu.mjs

   This changes your CURRENT `index.html` in place. The script makes a backup in
   `private-voice-output/index-before-about-menu.html` (which should remain Git-ignored).
   It can be run again safely; it won't install duplicate menus.

4. Test locally: open `about.html`, `index.html`, and `project-inquiry.html` through a local server.
   For example, if Python is installed:

   python -m http.server 8000

   Open `http://localhost:8000/index.html` and click `MENU` in the hero's top right.
   The menu should show HOME, ABOUT ME, PROJECT INQUIRY and disappear once
   the featured-work section has taken over the top of the viewport.

5. Verify before committing:

   git status -sb
   git diff -- index.html
   git check-ignore private-voice-output/inside-of-me.enc private-voice-output/private-voice-config.sql
   git ls-files -- private-voice-output/

   The final command MUST return nothing. NEVER commit the encrypted audio or config SQL.
   Also keep local edits/stashes backed up until you review them.

6. Stage ONLY expected files (including the updated index.html):

   git add index.html about.html css/about.css css/hero-menu.css js/about.js js/hero-menu.js tools/install-about-menu.mjs
   git diff --cached --name-only
   git commit -m "Add standalone About page and hero navigation"
   git push -u origin about-page

7. Create a GitHub pull request into `main`, test the Vercel Preview, and then merge it.

## File roles
- `about.html` — standalone About page with independent sections and navigation.
- `css/about.css` — all About page styles, responsive layout, and reduced-motion support.
- `js/about.js` — optional gentle scroll reveals.
- `css/hero-menu.css` — homepage hamburger and dropdown styles only.
- `js/hero-menu.js` — dropdown keyboard/pointer behavior and hero-only visibility.
- `tools/install-about-menu.mjs` — safe homepage installer; edits existing index.html only.

## Existing assets used (already in your website)
- `assets/images/project-inquiry-portrait.webp`
- `assets/images/build-with-me-approved-portrait.webp`
- `assets/favicon.svg`
- `assets/og-card.jpg`

## Security note
The About page does not import Supabase or read protected storage.
The `index.html` installer only inserts one menu, one CSS link and one JS link.
It does not change the Inside of Me voice-note code or API.
