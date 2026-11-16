# Assignment requirements and validation

Implemented in the newer `faizan-portfolio/` site only.

## Requirement checklist

- [x] About: Technical Skills section uses a real `ul` and eight `li` elements. Technologies are supported by the portfolio implementation and LGU ERP card.
- [x] Home: Project Overview uses `table`, `caption`, `thead`, `tbody`, `tr`, `th`, and `td`, with column and row headers. The named, keyboard-focusable region supports horizontal scrolling.
- [x] Table content reflects existing project cards. LGU ERP is under development; the other projects have no documented development status and are marked “Not specified.”
- [x] Home: a visible inline border and padding highlight the table's reading guidance, with an explanatory HTML comment.
- [x] About: an embedded `style` block applies only to the new skills section. The existing external stylesheet remains primary.
- [x] Inquiry: optional password, bounded age, date, mutually exclusive radios, multiple checkboxes, and reset button, with labels, fieldsets, legends, help text, and validation messages.
- [x] All new form values are explicitly labeled as local academic demonstrations. Password and age have no form names; no demonstration values are included in the explicit seven-field API payload.
- [x] Reset clears validation, custom validity, messages, error styling, completion state, and pending reveal timers. Native reset restores input and selection defaults. Reset is disabled while submission is pending.

## Checks completed on 2026-11-16

- All three pages loaded in Chromium via a local HTTP server.
- Fifteen browser assertions passed: required validation and first-error focus; email validation; error/status reset; age bounds; reference URL validation; exclusive radios and multiple checkboxes; exact API payload allowlist; demonstration data excluded; password cleared on submission; server error and retry; reset defaults; loading disables submit/reset; in-flight reset prevention; success reveal and focus; network error and retry.
- Submission tests stubbed browser `fetch`; no real messages were sent and the backend was unchanged.
- Static checks passed for semantic list/table elements, visible inline CSS, embedded CSS, and all six new control types.
- Checked 56 local HTML/CSS references, including cross-page links, fragment IDs, styles, scripts, images, and media: no missing targets. No duplicate IDs on the three pages.
- All existing client-side JavaScript files pass `node --check`; `git diff --check` passes.
- Source review confirmed existing responsive grid rules and reduced-motion handling remain. New skills use an adaptive grid; the table scrolls inside its own region; form controls use existing mobile grid breakpoints.
- Changes do not touch media, private voice code/files, authentication, environment configuration, API handlers, existing animation scripts, or project dialog handlers. The unrelated untracked rebuild script is excluded.

## Remaining verification

After the form tests and page loads, further browser inspection and resizing calls were rejected with “MCP tool call requires approval, but approval policy is never.” Consequently desktop/tablet/mobile visual review, screenshots, full keyboard navigation, actual reduced-motion emulation, console inspection, hero/pointer animation checks, project dialog interaction checks, and media playback were not completed. Internal link destinations were checked statically, not by clicking every link.

Real email delivery and production deployment were not exercised. Review the Vercel preview at 1440px, 768px, and 390px, including table scrolling, keyboard focus, and the optional form section, before merging.
