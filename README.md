# Target Builder

Target Builder helps teaching staff create clear, measurable SMART learner targets suitable for copying into ProMonitor or similar learner-management systems. It is a static, browser-based tool intended for teaching staff (personal tutors, subject lecturers, success coaches) to quickly convert a general concern into a well-worded SMART target.

Key points
- No learner names or personal data should be entered.
- The site does not store any data and does not send information externally.
- All target generation runs in the browser using rule-based templates (no AI).

Structure
- index.html — The single-page application UI.
- styles.css — Styles and responsive layout.
- app.js — All interactive behaviour implemented in vanilla JavaScript.
- data/targets.json — Template data, categories, issues and templates.

Running locally
1. Clone the repository.
2. Serve files with a simple local web server (required because some browsers block fetch from file://):

```bash
python -m http.server 8000
```

3. Open http://localhost:8000 in your browser.

Publishing with GitHub Pages
1. Push the repository to GitHub.
2. In the repository Settings → Pages, select the main branch and / (root) as the publishing source, or enable GitHub Pages from the repository settings.
3. The site will be available at https://<username>.github.io/<repository-name>/

Adding categories, issues or templates
- Edit `data/targets.json`.
- Each template object includes fields such as `id`, `category`, `issue`, `title`, `defaultAction`, `measureOptions`, `recommendedDuration`, `evidenceOptions`, `reviewerOptions`, `targetTemplate`, `supportActionTemplate`, `reviewNoteTemplate`, `aliases`, and `tags`.
- To add a new issue: append a new template record to the `templates` array. Keep `category` consistent for grouping.

Keyword matching
- The search matches terms against category, issue, title, aliases and tags.
- Add `aliases` to template records for common search phrases (e.g., "Friday", "patterned absence").

Privacy & safeguarding
- Do not enter learner names, medical details, safeguarding information, phone numbers, or emails.
- If a free-text field appears to contain an email address, phone number or an obvious numeric ID, a browser-side warning is shown. This is not exhaustive — follow college safeguarding procedures if you have concerns.

Accessibility
- Semantic HTML, visible focus states and keyboard navigation have been implemented.
- ARIA live regions are used for copy status messages.
- The design respects reduced-motion preferences.

Known limitations
- The personal-data detection is heuristic and will not catch everything.
- The templates are stored in JSON and loaded client-side; editing templates requires changing the JSON and redeploying the site.
- No printing layout beyond the browser's default print behaviour.

Future improvements
- Departmental or college template packs
- Favorites and quick-recall templates
- Printable learner action plans
- Optional secure server-side rewrite feature (would require appropriate approvals)

Thank you for using Target Builder. Contributions, suggested templates and improvements are welcome via pull requests.
