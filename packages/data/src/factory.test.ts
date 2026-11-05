import { expect, it } from 'vitest';
import { factoryDataset } from './factory';
import { dataset } from './index';
import { queryFactoryReference } from '@ps5/core';
import { factoryDatasetSchema } from '@ps5/core';
it('validates reviewed community batches independently from the formal directory', () => {
  expect(factoryDatasetSchema.safeParse(factoryDataset).success).toBe(true);
  expect(factoryDataset.records).toHaveLength(83);
  expect(new Set(factoryDataset.records.map((r) => r.family)).size).toBe(4);
  expect(
    factoryDataset.records
      .flatMap((r) => r.prefixes)
      .some((p) => p.startsWith('S01-X')),
  ).toBe(false);
  expect(dataset.firmwares).toEqual([]);
  expect(dataset.compatibility).toEqual([]);
  expect(
    factoryDataset.records.filter((r) => r.family === 'CFI-20'),
  ).toHaveLength(31);
  expect(
    factoryDataset.records.filter((r) => r.family === 'CFI-21'),
  ).toHaveLength(17);
  expect(
    factoryDataset.records.filter((r) => r.family === 'CFI-70'),
  ).toHaveLength(18);
  expect(
    factoryDataset.records.filter((r) => r.family === 'CFI-71'),
  ).toHaveLength(17);
  expect(
    queryFactoryReference(factoryDataset, { kind: 'serial', value: 'S01-F43B' })
      .records[0].versions,
  ).toEqual(['8.20', '8.20.02']);
  expect(
    queryFactoryReference(factoryDataset, { kind: 'serial', value: 'S01-F56B' })
      .matched,
  ).toBe(false);
  expect(
    queryFactoryReference(factoryDataset, {
      kind: 'model',
      value: 'CFI-2200B01',
    }).matched,
  ).toBe(false);
});
