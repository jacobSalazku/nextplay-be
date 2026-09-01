import { sanitizeRichText } from '../sanitize-rich-text';

describe('sanitizeRichText', () => {
  it('returns an empty string for null / undefined / empty', () => {
    expect(sanitizeRichText(null)).toBe('');
    expect(sanitizeRichText(undefined)).toBe('');
    expect(sanitizeRichText('')).toBe('');
  });

  it('keeps the formatting Tiptap produces', () => {
    const html =
      '<h2>Zone attack</h2><p><strong>Weak side</strong> <em>flash</em></p><ul><li>Screen</li></ul>';

    expect(sanitizeRichText(html)).toBe(html);
  });

  it('keeps a text-align style but nothing else', () => {
    expect(sanitizeRichText('<p style="text-align:center">x</p>')).toBe(
      '<p style="text-align:center">x</p>',
    );
    expect(
      sanitizeRichText('<p style="text-align:center;color:red">x</p>'),
    ).toBe('<p style="text-align:center">x</p>');
  });

  it('strips a script tag and its contents', () => {
    expect(sanitizeRichText('<p>ok</p><script>steal()</script>')).toBe(
      '<p>ok</p>',
    );
  });

  it('strips event-handler attributes', () => {
    expect(sanitizeRichText('<p onclick="x()">click</p>')).toBe('<p>click</p>');
  });

  it('drops an img with an onerror payload entirely', () => {
    expect(
      sanitizeRichText('<img src="x" onerror="steal(document.cookie)" />'),
    ).toBe('');
  });

  it('drops links and iframes', () => {
    expect(
      sanitizeRichText(
        '<a href="javascript:x()">l</a><iframe src="//e"></iframe>',
      ),
    ).toBe('l');
  });
});
