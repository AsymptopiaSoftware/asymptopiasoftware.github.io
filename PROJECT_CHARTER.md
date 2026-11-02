# Asymptopia Software — Project Charter

**Status:** Living requirements document. Established November 2, 2026.

This file records the durable goals and constraints for the **new** Asymptopia Software website. It is deliberately distinct from page content, design choices, and implementation tasks. Keep it under version control and consult it before making substantive changes.

## Mission

Preserve and make discoverable the user's original educational, scientific, and creative software, with the **software first** and the creator's story and history as supporting context.

Build a publicly accessible, long-lived, low-maintenance archive that does not require the owner, future caretakers, paid server hosting, or a private back end to keep its public pages available.

## Decisions already made

- **Canonical development home:** `AsymptopiaSoftware/asymptopiasoftware.github.io`.
- **Current technical foundation:** Astro static generation + Vue 3 components where useful.
- **Hosting:** GitHub Pages via GitHub Actions; no Linode dependency in the new site.
- **One site, one authoritative website repository.** Avoid proliferating competing website demos and repositories.
- **Start intentionally empty.** Do not automatically import the old website's project text, catalog ordering, images, or design. Every published item is reviewed and approved deliberately.
- **Preserve original repositories and their URLs.** Do not move, rename, overwrite, or transfer anything in `ccosse` just to reorganize this website. Link to or selectively copy original work where appropriate and approved.
- **Reading Edge is separate.** Keep the `Reading-Edge` organization and its separate future rewrite outside the current website rebuild; the main site may link to it when appropriate.
- **`software.vegas` need not be preserved as a brand or domain.** Preserve actual worthwhile software and update references before retiring its hosting/domain.

## Non-negotiable authoring requirements

1. **All public copy is owner-editable:** titles, headings, tags, dates, labels, descriptions, summaries, button text, captions, alt text, metadata, and links must live in clearly named content/configuration files where practical; not scattered across application logic.
2. **Images are owner-editable:** use a predictable `public/images/` structure (or equivalent) and editable content references for hero images, card images, screenshots and thumbnails. The owner must be able to replace an image or update its path through GitHub's web editor / file upload **without an assistant or a code change**. Document the exact steps.
3. **No accidental lock-in:** the public site must not depend on ChatGPT or any custom editor to make routine content/media changes.
4. **Single source of truth:** avoid duplicated copy or metadata across pages. Derive listings and individual project pages from consistent structured content.
5. **Content owner has final editorial control:** don't invent project descriptions, rankings, histories, testimonials, screenshots, or promotional claims. Leave explicit placeholders when content is undecided.
6. **Incremental changes:** review one topic/section at a time; do not populate the whole site or redesign adjacent sections without agreement.

## Discoverability and SEO from the outset

- Render each chosen project as **static, crawlable HTML** at its own stable, descriptive URL; no essential text only visible after client-side JavaScript runs.
- Support per-page titles, descriptions, canonical URLs, Open Graph/Twitter metadata, accessible image alt text, and relevant truthful JSON-LD structured data.
- Generate a sitemap and robots directives automatically; avoid duplicate or conflicting canonical URLs.
- During the bare-framework stage, keep `noindex` intentional. **Remove noindex when genuine content is ready**, before asking search engines to index the new site.
- Protect existing search visibility before the later DNS cutover: inventory currently indexed `asymptopia.com` paths, preserve URLs when reasonable, and plan redirects/404 handling for any changed URLs.
- Maintain fast, semantic, accessible, mobile-usable pages and avoid unnecessary dependencies.
- Be deliberate about internal linking between the homepage, individual projects, historical archive, source repositories, and launch pages.
- **Analytics is a first-class requirement:** measure genuine site use, referrers, search/campaign attribution, project launch clicks, download clicks, and trends while distinguishing real readers from bots and scans.
- **Separate browser analytics from HTTP-edge security analytics:** GitHub Pages exposes neither visitor access logs nor Apache-style error logs; GitHub repository Insights do not count website visitors. Any future raw-request visibility requires a separately authorized edge/proxy arrangement.
- **Analytics must remain editable, exportable, privacy-conscious and nonessential to site operation:** document provider ownership, permissions, data retention/export, and consent/privacy responsibilities. Do not start third-party tracking until configured and reviewed. Never send student data, personal identifiers, or page-query contents as custom event properties.

## Historical asymptopia.org identity

The user formerly operated **`asymptopia.org`**, but **does not control that domain now**.

- Develop an accurate historical account that mentions the original domain name as **plain text** where useful for visitors and searches.
- State clearly that `asymptopia.com` is the present official site when appropriate, and that the old domain is no longer under the user's control.
- **Do not claim ownership/control**, include `asymptopia.org` as a current canonical/homepage, use it as `sameAs` identity proof, or rely on redirects from it.
- Do not link to the old domain by default; choose any historical links only after review. Avoid SEO tricks that misrepresent ownership.
- Distinguish historical context from a promise of search ranking or transferred domain authority.

## Preservation and longevity

- Public source, reproducible build instructions, versioned dependencies/lockfile, and self-contained static output where practical.
- GitHub Actions publishes site changes; deployment should be straightforward for a future maintainer.
- Keep stable `github.io` availability even if the custom `.com` domain eventually expires.
- Document dependency updates, site handoff, domain renewal options, organization succession/backup owners, licensing, and independent backup/archive options before retiring Linode.
- Prefer no required server-side Python/Django, database, WebSocket, login service, or maintenance daemon for this public site. Existing external apps can be linked without rewriting them now.
- Do not switch `asymptopia.com` DNS or retire the Linode server until the new site is verified, content reviewed, SEO transition planned, and the owner explicitly approves.

## Security and stewardship of repository access

- Treat connected GitHub access as narrowly entrusted access, **not blanket permission to reorganize the owner's accounts**.
- Work in the Asymptopia website repository unless the owner specifically requests changes elsewhere.
- Favor small inspectable commits or PRs, meaningful commit messages, and reversible changes.
- Do not force-push, delete/rename/transfer repositories, change permissions/secrets, expose private data, alter production DNS, or publish substantive content without discussion and clear authorization.
- Read existing files and check repository state before modifying them. Report what changed and whether it deployed successfully; never assume a deploy succeeded merely because a workflow started.

## Implementation sequence (not a content commitment)

- [x] New GitHub organization connected.
- [x] New public organization website repository created.
- [x] Minimal Astro/Vue scaffold and GitHub Actions workflow committed.
- [ ] Confirm Pages build and client-side Vue test work reliably.
- [ ] Establish editable content/data schema **before** entering real content.
- [ ] Establish media paths and a documented self-service image replacement workflow.
- [ ] Add SEO infrastructure/templates and test build-time HTML.
- [ ] Agree on visual design, page types, and navigation with the owner.
- [ ] Add selected project content incrementally, after review.
- [ ] Document `asymptopia.org` history accurately when authoring that section.
- [ ] Enable a real analytics account and validate production page views and project event collection (not only source-code instrumentation).
- [ ] Add an independent HTTP-edge traffic view at custom-domain cutover; examine bot/scanner traffic without mislabeling it as readers.
- [ ] Set up regular durable export or backups of aggregate traffic and event results, subject to provider retention limits and privacy review.
- [ ] Inventory old `asymptopia.com` URLs and prepare SEO-safe domain transition.
- [ ] Arrange long-term backups, account succession, and eventual server retirement.

**Guiding rule:** Preserve the technical foundations and the owner's ability to edit everything, but never confuse *available legacy content* with *approved new content*.
