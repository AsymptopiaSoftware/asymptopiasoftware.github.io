# Asymptopia Traffic Intelligence — analytics architecture

**Status:** The website includes *provider-ready instrumentation*, but no visitor analytics is active until its settings are configured with real provider IDs. GitHub Pages alone does not provide Apache-like request logs.

## Our two distinct measurements

**Visitor/engagement analytics:** page views, inbound referrers, search campaigns, popular project pages, downloads, project launch clicks, and return trends.

**HTTP-edge/security analytics:** bot requests, scanner probes, HTTP statuses, missing URLs, traffic by country and requests blocked before reaching the static site. Browser-side analytics cannot see these. When the custom domain eventually moves to GitHub Pages, evaluate putting Cloudflare's proxy in front of that domain for free aggregate HTTP traffic reports. Full per-request or per-URL raw logs may require paid services or a separate logging endpoint, and are not promised at zero cost.

## Configuration

Edit **src/content/analytics.json** in GitHub.

```json
{
  "schemaVersion": 1,
  "ga4": { "enabled": false, "measurementId": "" },
  "cloudflareWebAnalytics": { "enabled": false, "token": "" }
}
```

Both providers are disabled until their identifying values are set. **No visitor tracking is active right now.** Don't set enabled=true before reviewing the site's privacy notice and regional consent obligations.

### Google Analytics 4 (GA4) — deeper interaction reporting

1. Create or choose a GA4 property at https://analytics.google.com/ and add a Web data stream for the GitHub Pages preview domain.
2. Copy the Web stream **Measurement ID**, starting with `G-`, into `ga4.measurementId`.
3. Review privacy/cookie-consent obligations and configure appropriate tracking preferences. Only then set `ga4.enabled` to true and commit.
4. Verify in GA4 **Realtime** while loading the site from a browser with tracking permitted.
5. Enable Enhanced Measurement in GA4 to observe pageviews, outbound clicks, scrolls (90%), and downloads. The site also contains an event hook for future project-specific interactions.

The GA4 helper listens for elements with both `data-analytics-event` and, where applicable, `data-project-slug`. The event allowlist is `project_launch`, `project_source_open`, `archive_download`, `welcome_replay`. Example: `<a href="..." data-analytics-event="project_launch" data-project-slug="d3plot">Launch</a>`. No actual project buttons are published yet. Never send student data, passwords, emails, form contents, IPs, or arbitrary query strings as event parameters.

**Data retention:** Standard GA4 reports are not the same as permanent unsampled raw events. For long-term analysis, consider periodically exporting reports or a carefully cost-controlled BigQuery export. BigQuery exports can incur storage/query charges and depend on a Google Cloud billing setup; do not enable paid features without approval. Keep a simple independent CSV archive of aggregate metrics when feasible.

### Cloudflare Web Analytics — complementary free browser stats

1. Add `asymptopiasoftware.github.io` under Web Analytics in your Cloudflare account, without changing DNS.
2. Copy the 32-character Web Analytics beacon token to `cloudflareWebAnalytics.token`.
3. Review the privacy implications, then set `cloudflareWebAnalytics.enabled` true and commit.
4. Inspect the Cloudflare Web Analytics dashboard.

Cloudflare Web Analytics is free and requires no Cloudflare proxy. It currently does **not** support custom events or UTM parameters, and offers roughly six months' report history. It's a useful second signal, not a substitute for event-level analytics or HTTP-edge logs.

## What GitHub offers, and what it doesn't

GitHub's **Insights → Traffic** measures repository visitors, clones, and referrers for about 14 days. It does **not** tell us how many people read the published GitHub Pages website. GitHub Pages does not provide downloadable access/error logs for visitors.

## Baseline reporting and future requirements

- Daily visits, users, pageviews, referrers, source/medium and campaigns.
- Popular project pages; launch and source-link events per project; archive downloads.
- Mobile/desktop split and geographic aggregation where permitted.
- Trends before and after promotion/search-indexing changes.
- Referrer quality, Google Search Console queries and indexing where available.
- Separate bot/scanner HTTP counts after a proxy or edge analytics solution is deployed.
- Export and archive data regularly for long-term preservation.
- Track the GitHub Pages preview separately from the future production domain, or use clear hostname segmentation.

**Status today:** Infrastructure committed; real tracking requires a service connection and an actual measurement ID. No scripts are injected without enabled=true and a syntactically valid ID.
