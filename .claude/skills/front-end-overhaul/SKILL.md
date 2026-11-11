---
name: front-end-overhaul
description: Overhaul the front end of a Professional Training keyword microsite built from the MasterMicroSite template (usually Eleventy 0.12, upgraded to Eleventy 3 as part of this). Use when asked to redesign, modernise or re-skin one of these microsites, or when asked to run this SKILL.md.
---

# Redesign the front end of a training microsite

These projects are microsites built from the MasterMicroSite template, usually still
on Eleventy 0.12. Each one sells instructor-led training for one keyword set
(`searchKeywords` in `src/_data/site.json`, e.g. "AI", "Adobe") and pulls course
data from the professional.ie API.

The goal is the end state described below. It was refined over several rounds of
feedback, so build it directly rather than proposing alternatives. Everything that
mentions a topic should use the site's own keyword, never a hard-coded one.

Before designing, load the frontend-design guidance (the `frontend-design` skill).

## Design principles

- Modern, simple and clear, with careful use of colour.
- Meets modern usability and accessibility standards (WCAG 2.1 AA).
- Optimised for Google search rankings.
- Some motion so the page doesn't feel static: an entrance for the banner text, and
  a few elements that ease in as they scroll into view. Only the elements listed in
  section 4 move. Never animate every section.

## 1. Get the project building first

Do this before any design work, and confirm the build is clean.

1. **Node.js:** if `npm` isn't found, Node isn't installed. Ask the user to run
   `! winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements`.
   The current shell won't see it on PATH until restarted, so call it by full path
   (`C:\Program Files\nodejs`) or prepend that folder to PATH in each command.
2. Run `npm install`, then do a one-off build: `npx @11ty/eleventy`.
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
4. **Save a baseline** once it builds: copy `build/` to a scratch folder and save its
   sorted file list. Every later step is checked against it, and the upgrade below
   must not change any URL.
5. Keep this skill at `.claude/skills/front-end-overhaul/` in the project root, not
   inside `src/`. Anything under `src/` is built into the site, and on Windows
   Eleventy 0.12 can't exclude it with `.eleventyignore` or `.gitignore`.

## 2. Upgrade to Eleventy 3

Do this after the baseline and before the redesign, so everything else is built on
the new version. Check that the project isn't already on v3 (`package.json`).

1. `npm uninstall @11ty/eleventy-cache-assets`, then
   `npm install --save-dev @11ty/eleventy@3`, `npm install @11ty/eleventy-fetch@5` and
   `npm install --save-exact slugify@1.5.3`.
2. In `src/_data/coursesapifull.js`, require `@11ty/eleventy-fetch` in place of
   `eleventy-cache-assets` (the API is the same), and delete the
   `require("node-fetch")` line. It's unused and isn't a declared dependency.
3. **Keep URLs identical.** v3's `slug` filter collapses repeated dashes, so a course
   name with an en dash ("Situations – Call") gets a different URL. Override it in
   `.eleventy.js` with the slugify version 0.12 used:
   `config.addFilter("slug", str => slugifyPackage(str, { replacement: "-", lower: true }))`,
   where `slugifyPackage = require('slugify')`. Leave a comment saying why it's
   pinned.
4. **`page` is reserved in v3.** Replace every front-matter `page:` block with a
   top-level `pageType:` key (keeping its `type` value), and change `page.type` to
   `pageType` in `htmlhead.njk`. Drop any old `page.title` values. They're stale
   copies from other sites (e.g. "Search For Angular Training").
5. **Liquid rejects unknown filters in v3.** Remove `| safe` (a Nunjucks filter) from
   `.md` pages; Liquid doesn't escape output anyway.
6. In the config's returned object, drop `templateFormats` (the
   `setTemplateFormats` call already sets them) and write the dirs without a leading
   slash: `input: 'src'`, `output: 'build'`, `layouts: '_includes/layout'`.
7. Build and compare with the baseline: the file list must be identical, and only
   expected pages may differ in content. The dev server (`npm run start:dev`,
   http://localhost:8080) is now Eleventy's own server.

## 3. Tidy the template leftovers

- **Stop building stub and debug pages** by adding `permalink: false` to their front
  matter: `testpagination.md` (`/test/...`), `ss.md` (a duplicate of
  `saved_searches.md`), an empty `about.md`, and `saved_searches.md` itself (its
  index page dumps the raw API data; the `/saved_searches/<city>/...` landing pages
  come from `landingpagespagination.md` and are unaffected).
- **Delete unused images.** Grep for each file name before deleting; words like
  "coding" or "background" give false matches. Old product logos (e.g. `adobe*.png`)
  and oversized testimonial photos are the usual leftovers.
- **`site.json` `logo`** is used as the image in the course structured data. Point it
  at an absolute URL that suits every keyword:
  `https://www.professional.ie/img/ProfessionalTrainingOffice.jpg`. Template copies
  often still point at a product logo.
- **Branding:** delete `original_branding.json` and the unused `neutral` and
  `gradient_*` keys, along with their lines in `branding.njk`.
- Check that `site.url` is the microsite's real domain. Template copies can still
  point at another site (e.g. `adobetraining.ie`), and every canonical link will be
  wrong.

## 4. Replace the front-end stack

- Remove Bootstrap 4, jQuery, Popper, Font Awesome, animate.css and AOS. Write one
  hand-made stylesheet (`src/css/style.css`) using CSS custom properties, plus a
  small `src/js/site.js` that progressively enhances the page. Every page must
  still work without JavaScript.
- Remove every `document.write`:
  - The copyright year becomes a `year` shortcode.
  - Booking buttons are always rendered. `site.js` swaps any whose date has passed
    for a "Completed" label.
- Layout shell (`base_layout.njk`): `lang="en-IE"`, a skip link, then `<header>`
  (nav), then `<main id="main">`, then `<footer>`. `htmlhead.njk` adds the `js` class
  to `<html>` in an inline script before anything is drawn; the scroll-in animations
  rely on it.

## 5. Visual system

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
| `accent_soft_color` | `#DCEFE7` (mint) | banner, closing call to action, inner page headers, topic tags |
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

## 6. Home page (`src/_data/home.json` + `makeSection.js`)

The section order is: banner, About, Testimonials, the closing call to action, then
the low-key topic and location index. The menu shows Home, About, Testimonials,
Schedule and Courses. All the copy lives in `home.json` so the user can edit it.

- **Banner (`banner`):**
  - The `<h1>` is the site title (e.g. "AI Training Courses Ireland"), followed by
    a one- or two-sentence lead: "Practical, instructor-led {keyword} training in
    Dublin, Cork and live online…".
  - Two buttons: "Browse courses" (`/courses/`) and "See course dates"
    (`/schedule/`).
  - On the right, an unDraw illustration on a mint background with a soft yellow
    disc behind it.
  - **Motion, pure CSS, on load:** `makeSection.js` wraps each headline word in
    `<span class="hero__word" style="--w:N">` and sets `--words` on `.hero__copy`.
    The words rise in about 90ms apart, then the lead, then the buttons, all within
    about 1.5 seconds. A title containing HTML is left whole. The illustration fades
    in and rises 8px.
  - Keep this look. These alternatives were mocked up and rejected: a typed AI
    prompt and reply, upcoming dates in the banner, a "pick your role" course
    finder, and big kinetic type with a ticker.
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
- **Closing call to action (`cta` type, `id: "get-started"`, `link: "no"`):**
  - Fields: `title`, `content` (a string or a list of paragraphs), `actions` (buttons,
    defaulting to Browse courses and See course dates), and an optional `note`, which
    may contain a link.
  - A mint band, so it bookends the page with the banner. The heading and text are on
    the left and the buttons are bottom-right. The note runs full width below a thin
    divider. It stacks to one column on phones, with full-width buttons.
  - Default copy: "Find the right {keyword} course for you"; a line on the range of
    courses ("From a one-day introduction … to in-depth courses for …. See what each
    course covers, then book a date in Dublin, Cork or live online."); and the note
    "Training a team? We can run any course at your premises or online, on dates
    that suit you. <a href="#contact">Contact us</a>". `#contact` is the footer's
    contact column.
- **Topic and location index (`asAccordion` in `makeSection.js`):** this exists for
  search engines, so keep it low-key, just above the footer:
  - No visible heading, intro text or illustration. Use a visually-hidden
    `<h2>Training by topic and location</h2>` for screen readers.
  - A `<details>` whose summary is small, muted text with a small chevron: "All
    topics and locations (N)". It is not a button, but keep a 44px tap height.
  - Inside, a compact grid in small text: each topic name (a small `<h3>` in the body
    font) with its location links. The visible link text is the location; add
    visually-hidden text with the full name.
- **Scroll-in motion** (`site.js` plus the "Scroll-in animations" block in
  `style.css`): this applies to the About illustration (`.topic .split__image`), the
  testimonial cards (`.quote`) and the call-to-action content (`.cta__inner`).
  - `.js .element` starts hidden from the first frame. This works only inside
    `@media (prefers-reduced-motion: no-preference)`, so with no JavaScript or with
    reduced motion nothing is ever hidden.
  - An IntersectionObserver adds `.is-visible`, so elements already on screen at
    load animate straight away. When the transform transition ends (or after a 2s
    fallback), `site.js` adds `.is-settled`.
  - The illustration slides in from the right. Cards rise in, staggered by
    `--i`, and the quote mark pops in shortly after.
  - Once `.is-settled`, the illustration drifts slowly (8px over 7s, using the
    `translate` property) and cards lift 4px on hover.
  - The print stylesheet forces all of these visible.
- Remove the old product logo images (e.g. Adobe logos) from home sections, and
  don't leave product names in section ids or anchors.

**Illustrations (unDraw):**
- Find suitable ones via `https://undraw.co/search/<term>`. The files are at
  `https://cdn.undraw.co/illustration/<name>.svg`.
- Two are needed: one for the banner (e.g. a person with a document and AI) and one
  for About (e.g. an instructor at a board). Pick ones that match the subject and
  avoid ones with large dark shapes.
- Download into a separate scratch folder, check them for `<script>`, event
  handlers and external `href`s, then recolour by replacing `#6c63ff` with the
  primary colour.
- Save to `src/img/undraw-<name>.svg`. The passthrough copy only covers the
  `src/img/` top level, not subfolders.
- In home.json, give each one `src`, `width` and `height` (from the SVG viewBox) so
  the page doesn't jump while loading. Use `alt=""` because they're decorative.
  Lazy-load everything below the banner.
- On phones, illustrations shrink to about 16–18rem and sit above their text.

## 7. Inner pages

- **Page header band (mint):** small "Courses" breadcrumb, `<h1>`, and lead text.
- **Course page:**
  - A facts row: duration, format, and next date. The next date must be the first
    *future* date (`nextDate` filter), not just the first one in the list.
  - **Next date jumps to the booking dates (must keep).** The next date in the
    facts row is a link, `<a href="#dates">Wed 2 Dec 2026</a>`, to the "Course
    dates" section (`<section class="band" id="dates">`) further down the page, so a
    visitor who sees a date they want can click it and land on the table with the
    Book buttons. To make this work:
    - Only render the "Next date" fact when `nextDate` returns a date; leave it
      out entirely when there are no future dates.
    - Use a plain anchor, not JavaScript, so it works without scripts.
    - In `style.css`, set `scroll-behavior: smooth` and `scroll-padding-top`
      (about `5.5rem`, the sticky header's height) on `html`, so the page glides
      down and the "Course dates" heading isn't hidden under the header. Switch
      back to `scroll-behavior: auto` under `prefers-reduced-motion: reduce`.
    - Check it on a built course page: click the date and confirm the dates table
      and its Book links are in view.
  - "What the course covers": each outline block in a responsive grid. The API's
    newline-separated text becomes a `<ul>` (`courseText` filter).
  - "Course dates" table (the `#dates` target): Date, Location and Book only, not
    the course name. Dates are formatted like "Mon 12 Oct 2026" (`displayDate`
    filter). Each Book link goes to
    `https://www.professional.ie/course_schedule/<course file>.html?id=<instance id>`
    and has visually-hidden text naming the course, date and location.
  - "Related topics" as light-green pill links.
  - If there are no dates, show a message pointing to "Contact us".
- **Courses list and keyword pages:** a list of courses showing name, a short
  description and "N days, next date …". Keyword pages show a message when no
  courses match.
- **Landing pages** (`landingpage_layout.njk`, `/saved_searches/<city>/...`):
  - The header band has the "Courses" breadcrumb, the `<h1>` (the saved-search
    title) and a lead: "Instructor-led {topic} courses in {location} and live
    online…". Use "across Ireland" when the location is Ireland.
  - The API's intro paragraphs come next, then `<h2>{topic} courses in {location}</h2>`,
    where topic is the keyword without " Training".
  - The course list matches the Courses page, including duration and next date. In
    `coursesapifull.js`, build each saved search's `courses` from
    `distinctCourseListWithSchedule` so the schedule is available.
- **Schedule page:** one section per course, each with a "Course details" link and
  a dates table.
- On phones, tables become stacked rows with the Book button on the right.
- **Footer addresses** use a `formatAddress` filter, which joins `line1`, `line2`,
  `town`, `county` and `postcode` with commas, including between county and
  Eircode (e.g. "Kinsale Road, Cork, T12 TP8H"), and skips blank parts. Printing
  each line with a comma leaves ", , ," when a line is empty.

## 8. Structured data (JSON-LD)

The template's JSON-LD is partly broken. Fix it as follows:
- **`instances.njk`:** the template adds commas between dates within a course but not
  between courses, so the schedule page's event list is invalid JSON. Collect the
  events into an array (`{% if events.push(...) %}{% endif %}`) and output
  `[{{ events | join(",") | safe }}]`.
- **`carousel.njk`:**
  - Output the name and description with `| dump | safe` (JSON encoding), because
    descriptions contain `"`.
  - Use course URLs of the form
    `https://{{ site.url }}/courses/{{ course.name | slug | removeInvalidChars }}/`.
  - Remove the nested `@context` lines.
- **Addresses:** keep one `offices` map (Cork, Dublin and Limerick, from `site.json`)
  and a `postalAddress(city)` helper in `.eleventy.js`. Use them in
  `getLocationInfo`, so Limerick no longer falls back to Cork, and in an
  `officeAddresses` shortcode for `educationalOrganisation.njk`.
  - In `educationalOrganisation.njk`, take the phones and email from `site.json`,
    set `sameAs` to the LinkedIn URL (`professionals.ie` only redirects to
    professional.ie), and set `image` to `site.logo`.
- Use `https://schema.org` everywhere, and an `https://` organizer URL.

## 9. Accessibility and SEO checklist

- One `<h1>` per page, with headings in order. Visible `:focus-visible` outlines
  (yellow on dark or green backgrounds). Touch targets at least 44px. Mobile menu
  uses a button with `aria-expanded` and closes with Escape. Every animation is
  switched off with reduced motion, and nothing is ever hidden when JavaScript is
  off.
- Each page has its own `<title>`, meta description, canonical
  (`https://{site.url}{page.url}`) and Open Graph tags.
  - Course page descriptions come from the course description, cut to 155
    characters.
  - Use a `metaTitle` front-matter field when the menu label (`title`) is too short
    for search results, e.g. on the Courses page.
  - `htmlhead.njk` chooses titles by the front-matter `pageType`.

## 10. Verify before reporting

1. Run a clean build with no errors or warnings, then confirm there is no
   `document.write`, Bootstrap or jQuery in the output.
2. Compare the build's file list with the baseline from step 1.4. The only changes
   should be the pages and images deliberately removed.
3. Parse every `<script type="application/ld+json">` block in `build/` with a JSON
   parser. All of them must be valid.
4. **Screenshots:** with the dev server running, use headless Edge or Chrome:
   `msedge --headless=new --hide-scrollbars --window-size=1400,3400 --virtual-time-budget=5000 --screenshot=<file> http://localhost:8080/`.
   - Check the home page (including the call to action and footer), a course page,
     a landing page and the schedule at desktop width.
   - Capture a course page with `#dates` on the end of the URL and confirm it opens
     at the "Course dates" heading, not hidden under the header.
   - A very short `--virtual-time-budget` (about 350ms) shows the banner animation
     mid-way.
   - Headless browsers won't lay out narrower than about 496px, so a 400px capture
     falsely looks cut off on the right. Check phone layout at 520px, or at a true
     390px inside an iframe.
5. Fix anything that looks off, such as elements overlapping or cropping an
   illustration, cramped spacing or wrong dates, then capture again.
6. Leave the dev server running, and report what changed, what was checked, and
   what the user needs to replace: the placeholder testimonial, the copy, the
   privacy page and `site.url`. Don't commit unless asked.

## Reference implementation

`C:\work\MicroSite\AiMicroSite` is a finished example of all of the above, for the
"AI" keyword. When it is available, compare against or copy from these files:
- `.eleventy.js` and `package.json`
- `src/_includes/` (`htmlhead.njk`, `nav.njk`, `footer.njk`, `branding.njk`,
  `makeSection.js`, `layout/*.njk`, `StructuredData/*.njk`)
- `src/css/style.css` and `src/js/site.js`
- `src/_data/branding.json`, `src/_data/home.json` and `src/_data/coursesapifull.js`
- `src/courses.md`, `src/keywordpagination.md` and `src/landingpagespagination.md`
