import { getMetadata } from '../../scripts/aem.js';

// SEO helper block: renders nothing visible. It sets the document language
// (Lighthouse "html has lang" audit) and injects Article JSON-LD structured
// data built from the page's existing content and metadata.

function abs(url) {
  if (!url) return undefined;
  try {
    return new URL(url, window.location.origin).href;
  } catch (e) {
    return undefined;
  }
}

export default function decorate(block) {
  block.remove();

  // 1) Ensure the <html> element declares a language.
  if (!document.documentElement.getAttribute('lang')) {
    document.documentElement.setAttribute('lang', 'en');
  }

  // 2) Build Article structured data (once).
  if (document.head.querySelector('script[data-blog-meta]')) return;

  const title = getMetadata('og:title') || document.title;
  const description = getMetadata('description') || getMetadata('og:description');
  const image = abs(getMetadata('og:image'));
  const author = getMetadata('author');
  const published = getMetadata('published-time') || getMetadata('publisheddate');
  const modified = getMetadata('modified-time') || getMetadata('updateddate');

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': window.location.href,
    },
  };
  if (description) data.description = description;
  if (image) data.image = [image];
  if (author) data.author = { '@type': 'Person', name: author };
  if (published) data.datePublished = published;
  if (modified) data.dateModified = modified;
  data.publisher = {
    '@type': 'Organization',
    name: 'Norton',
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.blogMeta = 'article';
  script.textContent = JSON.stringify(data);
  document.head.append(script);
}
