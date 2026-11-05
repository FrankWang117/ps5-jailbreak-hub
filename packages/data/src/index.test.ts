import { expect, it } from 'vitest';
import { publishedDatasetSchema, queryCompatibility } from '@ps5/core';
import { dataset } from './index';
import { demoDataset } from './demo';
import { preparationContent } from './index';
import { preparationContentSchema } from '@ps5/core';
it('validates preparation content separately from compatibility evidence', () => {
  expect(preparationContentSchema.safeParse(preparationContent).success).toBe(
    true,
  );
  expect(preparationContent.steps).toHaveLength(4);
  expect(preparationContent.platforms.linux.menuVerified).toBe(false);
  expect(dataset.compatibility).toEqual([]);
});
it('publishes only sourced CFI-2200B01 model fields with no invented firmware or compatibility', () => {
  expect(publishedDatasetSchema.safeParse(dataset).success).toBe(true);
  expect(dataset.models).toHaveLength(1);
  const model = dataset.models[0];
  expect(model.code).toBe('CFI-2200B01');
  expect(model.isExample).toBe(false);
  expect(model.region).toBe('日本');
  expect(model.edition).toBe('digital');
  expect(model.factoryFirmware).toBeNull();
  expect(
    dataset.modelSources.every((s) => s.verified && s.kind === 'primary'),
  ).toBe(true);
  expect(
    dataset.modelSources
      .flatMap((s) => s.claims)
      .some((c) => c.field === 'releaseDate' && c.value === '2025-11-21'),
  ).toBe(true);
  expect(dataset.firmwares).toEqual([]);
  expect(dataset.methods).toEqual([]);
  expect(dataset.evidence).toEqual([]);
  expect(dataset.compatibility).toEqual([]);
});
it('keeps demo records and fictional versions out of the default query', () => {
  expect(demoDataset.models.some((x) => x.id === 'demo-console')).toBe(true);
  expect(
    demoDataset.compatibility.every(
      (x) => x.isExample && x.status === 'unknown',
    ),
  ).toBe(true);
  expect(
    queryCompatibility(demoDataset, 'cfi-2200b01', '03.00').records,
  ).toHaveLength(1);
  for (const version of ['03.00', '99.99'])
    expect(
      queryCompatibility(dataset, 'cfi-2200b01', version).records,
    ).toHaveLength(0);
  expect(publishedDatasetSchema.safeParse(demoDataset).success).toBe(false);
});

it('validates the published knowledge JSON without treating articles as compatibility evidence', async () => {
  const { knowledgeBaseSchema } = await import('@ps5/core');
  const { knowledgeBase } = await import('./index');
  expect(knowledgeBaseSchema.safeParse(knowledgeBase).success).toBe(true);
  expect(knowledgeBase.articles).toHaveLength(9);
  expect(
    knowledgeBase.articles.every((article) => article.sources.length > 0),
  ).toBe(true);
  expect(dataset.evidence).toEqual([]);
  expect(dataset.compatibility).toEqual([]);
});
