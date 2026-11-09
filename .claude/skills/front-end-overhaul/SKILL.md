---
name: front-end-overhaul
description: Overhaul the front-end design of a Professional Training keyword microsite (Eleventy 0.12, built from the MasterMicroSite template). Use when asked to redesign, modernise or re-skin one of these microsites, or when asked to run this SKILL.md.
---

# Redesign the front end of a training microsite

These projects are Eleventy 0.12 microsites built from the MasterMicroSite template.
Each one sells instructor-led training for one keyword set (`searchKeywords` in
`src/_data/site.json`, e.g. "AI", "Adobe") and pulls course data from the
professional.ie API.

The goal is the end state described below. It was refined over several rounds of
feedback, so build it directly rather than proposing alternatives. Everything that
mentions a topic should use the site's own keyword, never a hard-coded one.

Before designing, load the frontend-design guidance (the `frontend-design` skill).

## Design principles

- Modern, simple and clear, with careful use of colour.
- Meets modern usability and accessibility standards (WCAG 2.1 AA).
- Optimised for Google search rankings.
- A small amount of motion so the page doesn't feel static. Do not overuse it.

## 1. Get the project building first

Do this before any design work, and confirm the build is clean.

1. **Node.js:** if `npm` isn't found, Node isn't installed. Ask the user to run
   `! winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements`.
   The current shell won't see it on PATH until restarted, so call it by full path
   (`C:\Program Files\nodejs`) or prepend that folder to PATH in each command.
2. Run `npm install`, then do a one-off build:
   `node node_modules/@11ty/eleventy/cmd.js`.
3. Fix these known template bugs if the build shows them:
   - **`DuplicatePermalinkOutputError` on `training_courses/c/`:** "C" and "C#" slugify
     the same way. Before `slug`, replace `#` with ` sharp` and `+` with ` plus`, in
     both the `keywordpagination.md` permalink and the course page "related topics"
     links. Do the same at the start of `slugify()` in `src/_includes/makeSection.js`,
     which also keeps `#` out of saved-search URLs.
   - **Duplicate saved-search pages:** the landing-page API can return the same
     keyword twice. In `src/_data/coursesapifull.js`, de-duplicate the landing-page
     JSON by keyword (case-insensitive) before building `msKeywordData`.
   - **"contains invalid WIN32 path characters":** some keywords contain `*`.
     Extend the `removeInvalidChars` filter in `.eleventy.js` to also strip
     `* ? " < > |`.
4. Keep this skill at `.claude/skills/front-end-overhaul/` in the project root, not
   inside `src/`. Anything under `src/` is built into the site, and on Windows
   `.eleventyignore` can't exclude it: Eleventy 0.12 builds broken absolute ignore
   paths there, so neither it nor `.gitignore` takes effect.
5. The dev server is `npm run start:dev` (http://localhost:8080).

## 2. Replace the front-end stack

- Remove Bootstrap 4, jQuery, Popper, Font Awesome, animate.css and AOS. Write one
  hand-made stylesheet (`src/css/style.css`) using CSS custom properties, plus a
  small `src/js/site.js` that progressively enhances the page. Every page must
  still work without JavaScript.
- Remove every `document.write`:
  - The copyright year becomes a `year` shortcode.
  - Booking buttons are always rendered. `site.js` swaps any whose date has passed
    for a "Completed" label.
- Layout shell (`base_layout.njk`): `lang="en-IE"`, a skip link, then `<header>`
  (nav), then `<main id="main">`, then `<footer>`.
- Leave the JSON-LD structured-data includes as they are.

## 3. Visual system

**Colour.** Tokens live in `src/_data/branding.json` and are output as CSS variables
by `branding.njk`. Keep the same keys so each microsite can re-theme, and give every
new key a fallback in `branding.njk` so sites without it don't break.

| Key | Value | Use |
|---|---|---|
| `primary_color` | `#0E6B57` (green) | links, buttons, accents, testimonials band |
| `primary_strong_color` | `#0A5243` | hover states, text on light green |
| `secondary_color` | `#EEF3F1` (mist) | alternating section bands, course dates band |
| `foreground_color` | `#1E2A28` (ink) | body text |
| `secondary_foreground_color` | `#4F5D5A` | secondary text |
| `highlight_color` | `#F5C84B` (yellow) | focus outline on green, text selection |
| `accent_soft_color` | `#DCEFE7` (mint) | banner and inner page headers, topic tags |
| `accent_deep_color` | `#0B3F34` | footer |
| `warm_soft_color` | `#FCF1CF` | soft disc behind the banner illustration |

Any new colour pair must reach at least 4.5:1 contrast for text. Check this before
using it, and never convey meaning with colour alone.

**Type.** Bricolage Grotesque (headings, 500/700) and Atkinson Hyperlegible (body),
from Google Fonts with `display=swap`. Body text is about 17px with 1.6 line height,
and readable text blocks are capped at about 68 characters per line.

**Avoid these generic patterns:** all-caps labels above headings, gradient washes, an
identical card-and-shadow on every element, fade-in on every section, and arrows
appended to link text.

## 4. Home page (`src/_data/home.json` + `makeSection.js`)

The section order is: banner, About, Testimonials, then "Find training by topic and
location". The menu shows Home, About, Testimonials, Schedule and Courses.

- **Banner (`banner`):**
  - The `<h1>` is the site title (e.g. "AI Training Courses Ireland"), followed by
    a one-sentence lead: "Practical, instructor-led {keyword} courses in Dublin,
    Cork, Limerick and live online…".
  - Two buttons: "Browse courses" (`/courses/`) and "See course dates"
    (`/schedule/`).
  - On the right, an unDraw illustration on a mint background with a soft yellow
    disc behind it.
  - **Motion:** the illustration fades in and rises 8px over about 1 second on load.
    This is the only automatic motion on the page.
  - Do **not** add a typing or "how AI works" demo to the banner. It was tried and
    rejected as unnecessary.
- **About (`text` type with a `content` array):** one simple section with a heading
  ("About our {keyword} courses") and two short paragraphs in a single column, with
  an illustration beside it. Do not split it into several About sections or
  columns. If the template's home.json has one section per product, merge their
  text into these two paragraphs.
- **Testimonials (`quotes` type, `id: "testimonials"`):**
  - Heading "What our attendees say". Each quote is a white card on a solid green
    band, with a large green opening quote mark and the name and job title below a
    divider.
  - Cards sit side by side, two or three to a row, and stack on phones. Cards in a
    row are equal height.
  - Add **one clearly-marked placeholder** for the user to replace, e.g. "Placeholder
    testimonial. Replace this with a short quote from a real course attendee…".
    Never invent realistic testimonials.
- **Find training by topic and location:** the saved-search index. Show the heading
  and one line of text beside an illustration, then a "Show all N topics" button
  using `<details>`. Inside, list each topic with its location links. The visible
  link text is the location; add visually-hidden text with the full name for
  screen readers.
- Remove the old product logo images (e.g. Adobe logos) from home sections, and
  don't leave product names in section ids or anchors.

**Illustrations (unDraw):**
- Find suitable ones via `https://undraw.co/search/<term>`. The files are at
  `https://cdn.undraw.co/illustration/<name>.svg`.
- Pick illustrations that match the section's subject, e.g. a person with a
  document and AI for the banner, an instructor at a board for About, and a map pin
  for locations. Avoid ones with large dark shapes.
- Download into a separate scratch folder, check them for `<script>`, event
  handlers and external `href`s, then recolour by replacing `#6c63ff` with the
  primary colour.
- Save to `src/img/undraw-<name>.svg`. The passthrough copy only covers the
  `src/img/` top level, not subfolders.
- In home.json, give each one `src`, `width` and `height` (from the SVG viewBox) so
  the page doesn't jump while loading. Use `alt=""` because they're decorative.
  Lazy-load everything below the banner.
- On phones, illustrations shrink to about 16–18rem and sit above their text.

## 5. Inner pages

- **Page header band (mint):** small "Courses" breadcrumb, `<h1>`, and lead text.
- **Course page:**
  - A facts row: duration, format, and next date. The next date must be the first
    *future* date (`nextDate` filter), not just the first one in the list.
  - "What the course covers": each outline block in a responsive grid. The API's
    newline-separated text becomes a `<ul>` (`courseText` filter).
  - "Course dates" table: Date, Location and Book only, not the course name. Dates
    are formatted like "Mon 12 Oct 2026" (`displayDate` filter). Each Book link has
    visually-hidden text naming the course, date and location.
  - "Related topics" as light-green pill links.
  - If there are no dates, show a message pointing to "Contact us".
- **Courses list and keyword pages:** a list of courses showing name, a short
  description and "N days, next date …". Keyword pages show a message when no
  courses match.
- **Schedule page:** one section per course, each with a "Course details" link and
  a dates table.
- On phones, tables become stacked rows with the Book button on the right.

## 6. Accessibility and SEO checklist

- One `<h1>` per page, with headings in order. Visible `:focus-visible` outlines
  (yellow on dark or green backgrounds). Touch targets at least 44px. Mobile menu
  uses a button with `aria-expanded` and closes with Escape. Reduced-motion
  preference is respected.
- Each page has its own `<title>`, meta description, canonical
  (`https://{site.url}{page.url}`) and Open Graph tags.
  - Course page descriptions come from the course description, cut to 155
    characters.
  - Use a `metaTitle` front-matter field when the menu label (`title`) is too short
    for search results, e.g. on the Courses page.
  - Templates set front-matter `page.type`, but `page.url` still works.
- Check that `site.url` is the microsite's real domain. Template copies can still
  point at another site (e.g. `adobetraining.ie`), and every canonical link will be
  wrong.

## 7. Verify before reporting

1. Run a clean build with no errors, then confirm there is no `document.write`,
   Bootstrap or jQuery in the output.
2. **Screenshots:** headless Chrome hangs on the Browsersync dev server, so serve
   `build/` with a tiny static Node server on another port, then run
   `chrome --headless=new --screenshot --virtual-time-budget=…`.
   - Check the home page, a course page and the schedule at 1280px.
   - Check phone width at a true 390px inside an iframe. Headless Chrome won't go
     below about 500px window width, so a direct 390px capture looks like it
     overflows when it doesn't.
3. Fix anything that looks off, such as elements overlapping or cropping an
   illustration, cramped spacing or wrong dates, then capture again.
4. Leave the dev server running, and report what changed, what was checked, and
   what the user needs to replace: the placeholder testimonial, the copy, and
   `site.url`. Don't commit unless asked.

## Reference implementation

`C:\work\MicroSite\AiMicroSite` is a finished example of all of the above, for the
"AI" keyword. When it is available, compare against or copy from these files:
- `.eleventy.js`
- `.eleventyignore`
- `src/_includes/` (`htmlhead.njk`, `nav.njk`, `footer.njk`, `branding.njk`,
  `makeSection.js`, `layout/*.njk`)
- `src/css/style.css` and `src/js/site.js`
- `src/_data/branding.json` and `src/_data/home.json`
- `src/courses.md` and `src/keywordpagination.md`
