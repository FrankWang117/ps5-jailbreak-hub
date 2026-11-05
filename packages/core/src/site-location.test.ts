import { expect, it } from 'vitest';
import { parseSiteLocation, publicSiteRoot } from './site-location';
it('keeps root development and a canonical subdirectory distinct', () => {
  expect(publicSiteRoot(parseSiteLocation({}), 'http://localhost:5173')).toBe(
    'http://localhost:5173/',
  );
  const site = parseSiteLocation({
    basePath: '/ps5/',
    siteUrl: 'https://voidbai.com/ps5/',
  });
  expect(publicSiteRoot(site, 'http://localhost:5188')).toBe(
    'https://voidbai.com/ps5/',
  );
  expect(
    publicSiteRoot(
      parseSiteLocation({ basePath: '/ps5/' }),
      'http://localhost:5188',
    ),
  ).toBe('http://localhost:5188/ps5/');
});
it('rejects mismatched paths and unsafe deployment settings rather than silently building broken links', () => {
  for (const basePath of [
    'ps5',
    '/ps5',
    '//ps5/',
    '/../',
    'https://example.test/',
    '/ps5/?x=1',
  ])
    expect(() => parseSiteLocation({ basePath })).toThrow();
  for (const siteUrl of [
    'https://voidbai.com/',
    'http://voidbai.com/ps5/',
    'https://user:pass@voidbai.com/ps5/',
    'https://voidbai.com/ps5/?token=x',
    'https://voidbai.com/ps5/#x',
    'invalid',
  ])
    expect(() => parseSiteLocation({ basePath: '/ps5/', siteUrl })).toThrow();
});
