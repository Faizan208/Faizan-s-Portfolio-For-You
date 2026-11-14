# FAIZAN — Editorial Portfolio (HTML / CSS / JavaScript)

A complete no-framework university web-technologies project with:

- The existing FAIZAN hero, scroll handoff and cursor-reveal effect.
- Built for the Real World / featured projects and Other Experiments.
- Build With Me, with its linked Project Inquiry page.
- **09 / Content Creator** — ExplainWeeb YouTube chapter with an interactive 16:9 access notice and native HTML video/audio players.

## Run

Open `index.html` in a modern browser, or use VS Code Live Server. No npm, framework or build step is required.

## ExplainWeeb / Featured YouTube Video

The feature is labeled `ACCESS RESTRICTED`. Clicking its play button displays: "You are not permitted to access this URL."

Every former channel link in the feature notice, creator section, and footer is replaced with: "You are not permitted to review this YouTube channel." The channel URL is also removed from the page's structured metadata. The play button does not load a YouTube iframe or navigate away.

Other socials are intentionally omitted because no real account links were supplied.

## Native HTML Video and Audio

The required HTML media elements exist inside Content Creator:

```html
<video controls preload="none">
  <source src="assets/portfolio-video.mp4" type="video/mp4">
</video>

<audio controls preload="none">
  <source src="assets/faizan-audio-intro.mp3" type="audio/mpeg">
</audio>
```

These filenames are **placeholders**, not actual media. To make the players play content, put real compatible files at:

- `assets/portfolio-video.mp4`
- `assets/faizan-audio-intro.mp3`

The placeholders are clearly labeled on the page so visitors won't mistake missing media for published content.

## Files

- `index.html` — main portfolio, including new Content Creator section after Build With Me
- `css/style.css` — existing CSS followed by isolated Content Creator styles
- `js/script.js` — existing scripts followed by isolated Content Creator behavior
- `project-inquiry.html`, `css/inquiry.css`, `js/inquiry.js` — existing inquiry page, unchanged
- `assets/images/` — previously approved original portfolio imagery

## Notes

Only HTML, CSS, JavaScript and native browser APIs are used. No React, Tailwind, Bootstrap, GSAP or external animation library is required. Animations honor `prefers-reduced-motion`.


## Final editorial footer & full-hero cursor (October 2026)
- New `10 / THE LAST PAGE` footer follows the Content Creator chapter, inspired by the supplied footer layout but built in the FAIZAN cream/red/charcoal design language.
- Footer links navigate to real sections, the existing inquiry page, and the user-supplied ERP URL. The former ExplainWeeb link displays the channel restriction message.
- The cursor-following circular ring now appears **everywhere within the visible hero**, including empty spaces and header area. The transparent blue FAIZAN mask still affects only the letter artwork.
- All previous projects, media placeholders, inquiry form and hero artwork are retained.
- Native HTML/CSS/JavaScript; no dependencies. `index.html` runs locally.
