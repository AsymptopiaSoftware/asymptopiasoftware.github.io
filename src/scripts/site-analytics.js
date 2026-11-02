/**
 * Future site links can opt into project-level analytics with:
 *   <a data-analytics-event="project_launch" data-project-slug="d3plot" ...>
 * Allowed event names and slugs only; never send names, full URLs, search queries or student data.
 *
 * GA4 enhanced measurement handles pageviews and generic outbound/download clicks.
 * This helper adds project-specific intent when we actually publish project pages.
 */
const EVENT_NAMES = new Set([
  'project_launch',
  'project_source_open',
  'archive_download',
  'welcome_replay'
]);

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const target = event.target.closest('[data-analytics-event]');
  if (!target) return;

  const name = target.getAttribute('data-analytics-event');
  if (!EVENT_NAMES.has(name)) return;
  if (typeof window.gtag !== 'function') return;

  const slug = target.getAttribute('data-project-slug') || '';
  if (slug && !SLUG_PATTERN.test(slug)) return;

  const params = slug ? { project_slug: slug } : {};
  window.gtag('event', name, params);
});
