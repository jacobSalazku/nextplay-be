import sanitizeHtml from 'sanitize-html';

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'strong',
    'em',
    's',
    'u',
    'mark',
  ],
  allowedAttributes: { '*': ['style'] },
  allowedStyles: {
    '*': { 'text-align': [/^(left|right|center|justify)$/] },
  },
  disallowedTagsMode: 'discard',
};

/**
 * Strip anything the Tiptap editor can't produce. The stored value is rendered
 * with `dangerouslySetInnerHTML`, so a client that POSTs raw markup straight to
 * the API (bypassing the editor) must not be able to inject scripts.
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, OPTIONS);
}
