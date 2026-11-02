import { expect, it } from 'vitest';
import { queryCompatibility } from '@ps5/core';
import { dataset } from './index';
it('ships CFI-2200B01 with only clearly marked unknown sample records', () => {
  expect(dataset.models.some((x) => x.code === 'CFI-2200B01')).toBe(true);
  expect(dataset.compatibility.length).toBeGreaterThan(0);
  expect(
    dataset.compatibility.every((x) => x.isExample && x.status === 'unknown'),
  ).toBe(true);
  expect(
    dataset.evidence.every((x) => x.kind === 'example' && !x.verified),
  ).toBe(true);
  expect(
    queryCompatibility(dataset, 'cfi-2200b01', '03.00').records[0].status,
  ).toBe('unknown');
});
