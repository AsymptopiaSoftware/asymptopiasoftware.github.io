# SEO and image metadata

The primary editable identity and SEO configuration is src/content/brand.json. Use GitHub's web Edit button, then commit. Astro generates HTML at build time.

- name, slogan, establishedYear: original identity.
- logo, logoAlt: image path and accessible alternate text.
- seo.title, seo.description: page title, metadata and social preview text.
- seo.creator, seo.alternateName: website identity information.
- seo.socialImage: optional representative social preview image path (prefer a suitable JPG, PNG or WebP over SVG); deliberately blank for now.
- seo.indexable: false while the site is a blank prototype. Set true only after the content has been reviewed for public indexing.

The shared Astro layout provides canonical URLs, descriptions, Open Graph/Twitter tags, and JSON-LD WebSite/WebPage information. Current canonical URLs use the GitHub Pages domain; change these only when the asymptopia.com switch has been approved.

For future projects, provide each page with its own genuine, visible, original description, HTML title and heading, canonical URL, screenshot alt text, and source and launch links. Keep image names short and informative (for example, tuxmathscrabble-equation-gameplay.png). Google finds image information in page context, alt text and filenames; embedded PNG comments or EXIF metadata are not a dependable authority signal.

Use factual repetition where it helps connect related projects, but avoid keyword stuffing. Do not rely on meta keywords. The SVG logo already contains an accessible title and description. The old asymptopia.org domain may be described truthfully in future historical content, but is not controlled by the author and should not be used as a current canonical address or sameAs identity.

## Change an image without programming

Upload a replacement asset into public/images/ through GitHub. If its filename changes, edit its path in src/content/brand.json or the future project record. Commit the change and verify that the version badge increases.

The development site remains noindex until meaningful content is approved.
