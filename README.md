# SMART Target Builder

SMART Target Builder is a static, browser-based tool for teaching staff who need to create clear, measurable learner targets for ProMonitor or a similar learner-management system.

It helps a lecturer move from a broad concern—such as poor attendance, missed coursework or limited participation—to a specific learner action, success measure and review point. It also creates a separate staff support action and review note.

## Key principles

- Target generation is rule-based and takes place entirely in the browser.
- The app does not use generative AI or an external API.
- Learner names and other personal or sensitive information are not required.
- Form and target content is not stored, logged or sent anywhere.
- The only saved browser preference is light or dark theme.
- Staff remain responsible for reviewing and adapting every target.

## Intended users

- Personal tutors
- Subject lecturers
- Success Coaches
- Curriculum leads
- English and maths lecturers
- Work experience staff

## Project structure

- `index.html` — semantic single-page interface
- `styles.css` — responsive light and dark themes
- `app.js` — navigation, validation, search and rule-based target generation
- `data/targets.json` — categories, issues and recommended target components

There are no npm packages, build steps, cookies, analytics or server-side components.

## Run locally

Loading the JSON target library requires a local web server. From the repository folder, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Opening `index.html` directly with a `file://` URL may prevent the browser from loading `data/targets.json`.

## Publish with GitHub Pages

1. Push the project to the repository's `main` branch.
2. Open the repository on GitHub.
3. Select **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose `main` and `/ (root)`.
6. Save and wait for GitHub Pages to publish the site.

All project paths are relative, so the app works when published beneath a repository path such as:

```text
https://username.github.io/repository-name/
```

## Target data

`data/targets.json` contains a `categories` array. Each category includes:

- `id`
- `name`
- `icon`
- `description`
- `evidenceOptions`
- `reviewerOptions`
- `supportTemplate`
- `issues`

Each issue includes:

- `id`
- `issue`
- `title`
- `action`
- `measure`
- `measures`
- `duration`
- `aliases`
- optional issue-specific `support`

### Add a category

Add another object to the top-level `categories` array. Use a unique lowercase, hyphenated `id`, an icon name already supported by `app.js`, and at least one issue.

### Add an issue

Add an object to the relevant category's `issues` array. Keep the wording learner-facing and actionable. The `action` should normally begin with a verb such as “attend”, “complete”, “check” or “contact”.

### Edit a target

Adjust the issue's `action`, `measures`, `duration`, evidence options or support wording. Generation combines those approved components with shared review and evidence wording.

Recommended duration values are:

- `1 week`
- `2 weeks`
- `3 weeks`
- `4 weeks`
- `date`
- `next review`

### Keyword matching

Search normalises the query and compares it with:

- category name and description
- issue and title
- aliases
- learner action
- success measures

Matches in the issue, title or aliases receive a stronger score. Add realistic plain-language aliases such as `misses Fridays`, `phone use` or `not checking Canvas`.

## Privacy and safeguarding

Do not enter:

- learner names
- medical or safeguarding details
- email addresses
- phone numbers
- student IDs
- other identifiable personal information

The app performs a limited browser-side check for email addresses, phone numbers and obvious labelled student IDs. This is only a prompt and cannot detect every form of personal information.

Safeguarding, welfare and support concerns must be managed through the appropriate college procedures.

## Accessibility

The interface aims to follow WCAG 2.2 AA principles through:

- semantic headings, sections, forms and buttons
- a skip link
- visible keyboard focus
- labelled native form controls
- non-colour selected indicators
- accessible live status messages
- 44-pixel minimum controls
- light and dark colour schemes
- reduced-motion support
- responsive layouts without custom dropdown widgets

Automated checks do not replace testing with assistive technology or disabled users.

## Testing checklist

- Open every category and confirm every issue can reach the builder.
- Generate a target for each issue.
- Check one-, two-, three- and four-week calculated dates.
- Check a custom review date.
- Test custom measure, evidence and reviewer fields.
- Test search examples and a no-result query.
- Test target variants and manual editing.
- Test all copy actions.
- Test the privacy warning with a dummy email, phone number and labelled student ID.
- Test clear and start-new confirmation behaviour.
- Test light and dark themes.
- Test keyboard navigation and visible focus.
- Test common desktop, tablet and mobile widths.
- Check the browser console for errors.

## Known limitations

- Generation is rule-based and cannot understand context like an AI system.
- Personal-data detection is deliberately simple and cannot detect names or every identifier.
- Review dates add calendar weeks rather than teaching-calendar weeks.
- Content changes require editing the JSON file and redeploying the site.
- The app does not save favourites, drafts or target history, by design.
- The SMART panel checks the presence and broad shape of target components; it cannot judge whether a target is professionally appropriate.

## Possible future improvements

- College branding options
- Approved department-specific target packs
- Importing a centrally managed target library
- Printable learner action plans
- An administrator template editor
- ProMonitor integration, subject to available APIs and approval
- A secure server-side AI rewriting feature, subject to governance and approval
- Anonymous analytics, only with consent and an appropriate privacy basis
