import { expect, it } from 'vitest';
import {
  captureFactoryPrefix,
  factoryDatasetSchema,
  factoryPrefixSchema,
  queryFactoryReference,
  siteContentSchema,
} from './index';
it('preserves extended factory versions independently and validates beta metadata', () => {
  const d = fixture();
  d.records[0].versions = ['8.20.02'];
  expect(
    queryFactoryReference(d, { kind: 'serial', value: 'S01-F561' }),
  ).toMatchObject({
    compatibility: 'unknown',
    records: [{ versions: ['8.20.02'] }],
  });
  const site = {
    release: '0.1.0-beta.1',
    feedbackUrl: 'https://example.test/issues/new',
    feedbackCheckedAt: '2026-11-05',
  };
  expect(siteContentSchema.safeParse(site).success).toBe(true);
  expect(
    siteContentSchema.safeParse({ ...site, feedbackUrl: 'javascript:alert(1)' })
      .success,
  ).toBe(false);
});
it('extracts only explicit S01 prefixes without retaining serial tails or guessing other formats', () => {
  expect(captureFactoryPrefix(' s01–f568334 ')).toEqual({
    kind: 'accepted',
    suffix: 'F568',
    truncated: true,
    hasPrefix: true,
  });
  expect(captureFactoryPrefix('f568')).toMatchObject({
    suffix: 'F568',
    truncated: false,
  });
  expect(captureFactoryPrefix('')).toMatchObject({
    suffix: '',
    truncated: false,
  });
  expect(captureFactoryPrefix('CFI-2200B01')).toEqual({ kind: 'invalid' });
  expect(captureFactoryPrefix('AJ13501234')).toEqual({ kind: 'invalid' });
  expect(captureFactoryPrefix('F568334')).toEqual({ kind: 'invalid' });
  expect(captureFactoryPrefix('S01-F568 334')).toEqual({ kind: 'invalid' });
  expect(captureFactoryPrefix('S01-X568334')).toMatchObject({ suffix: 'X568' });
});
function fixture() {
  return factoryDatasetSchema.parse({
    updatedAt: '2026-11-05',
    sources: [
      {
        id: 'fixture',
        title: 'Test fixture only',
        publisher: 'Test',
        url: 'https://example.test/factory',
        kind: 'community',
        reviewed: true,
        checkedAt: '2026-11-05',
        revision: 'test',
        limitations: 'Not real production evidence',
      },
    ],
    records: [
      {
        id: 'a',
        family: 'CFI-21',
        prefixes: ['S01-F561'],
        period: '2026-01',
        versions: ['03.00', '3.00'],
        sourceId: 'fixture',
      },
      {
        id: 'b',
        family: 'CFI-70',
        prefixes: ['S01-K145'],
        period: '2024-05',
        versions: ['09.00'],
        sourceId: 'fixture',
      },
    ],
  });
}
it('matches only listed prefixes and keeps all estimates out of compatibility conclusions', () => {
  const d = fixture();
  expect(
    queryFactoryReference(d, { kind: 'serial', value: ' s01-f561 ' }).records[0]
      .versions,
  ).toEqual(['03.00', '3.00']);
  expect(
    queryFactoryReference(d, { kind: 'serial', value: 'S01-F562' }),
  ).toMatchObject({ matched: false, compatibility: 'unknown' });
  expect(
    queryFactoryReference(d, { kind: 'serial', value: 'S01-E561' }).matched,
  ).toBe(false);
  expect(
    queryFactoryReference(d, { kind: 'serial', value: 'S01-X561' }).matched,
  ).toBe(false);
  expect(
    queryFactoryReference(d, { kind: 'model', value: 'CFI-2116A' }).records.map(
      (r) => r.id,
    ),
  ).toEqual(['a']);
  expect(
    queryFactoryReference(d, { kind: 'model', value: 'CFI-2200B01' }).records,
  ).toEqual([]);
  expect(
    queryFactoryReference(d, { kind: 'serial', value: 'S01-F561' })
      .compatibility,
  ).toBe('unknown');
  expect(factoryPrefixSchema.safeParse('S01-F561123456789').success).toBe(
    false,
  );
});
it('rejects missing, unreviewed, duplicate or invalid batch data', () => {
  const d = fixture();
  expect(factoryDatasetSchema.safeParse({ ...d, sources: [] }).success).toBe(
    false,
  );
  expect(
    factoryDatasetSchema.safeParse({
      ...d,
      sources: [{ ...d.sources[0], reviewed: false }],
    }).success,
  ).toBe(false);
  expect(
    factoryDatasetSchema.safeParse({
      ...d,
      records: [d.records[0], { ...d.records[0], id: 'duplicate' }],
    }).success,
  ).toBe(false);
  expect(
    factoryDatasetSchema.safeParse({
      ...d,
      records: [{ ...d.records[0], sourceId: 'missing' }],
    }).success,
  ).toBe(false);
  expect(
    factoryDatasetSchema.safeParse({
      ...d,
      records: [{ ...d.records[0], period: '2026-13' }],
    }).success,
  ).toBe(false);
});
