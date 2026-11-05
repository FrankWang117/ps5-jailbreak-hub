import { expect, it } from 'vitest';
import {
  assessPreparation,
  emptyDeviceProgress,
  emptyPreparation,
  preparationProgressSchema,
  readPreparation,
} from './index';
const basis = {
  ...emptyDeviceProgress().answers,
  modelCode: 'CFI-TEST01',
  systemVersion: '03.00.00.09',
  computer: 'yes' as const,
  computerOs: 'windows' as const,
};
it('requires explicit preparation answers without reporting execution readiness', () => {
  expect(
    assessPreparation(emptyPreparation(emptyDeviceProgress().answers)).pending,
  ).toBe('computer');
  expect(
    assessPreparation(emptyPreparation({ ...basis, computerOs: 'unknown' }))
      .pending,
  ).toBe('os');
  const p = emptyPreparation(basis);
  expect(assessPreparation({ ...p, step: 1 }).pending).toBe('address');
  expect(
    assessPreparation({ ...p, step: 2, addressLocated: true }).pending,
  ).toBe('network');
  expect(
    assessPreparation({
      ...p,
      step: 2,
      addressLocated: true,
      networkPlanned: true,
    }).pending,
  ).toBe('settings');
  const complete = {
    ...p,
    step: 3,
    addressLocated: true,
    networkPlanned: true,
    settingsRecorded: true,
    confirmed: true,
  };
  expect(assessPreparation(complete)).toEqual({
    pending: null,
    canAdvance: true,
    executionReady: false,
  });
});
it('restores only the same device and platform and rejects corrupt or impossible progress', () => {
  const p = {
    ...emptyPreparation(basis),
    step: 3,
    addressLocated: true,
    networkPlanned: true,
    settingsRecorded: true,
    confirmed: true,
  };
  expect(readPreparation(JSON.stringify(p), basis)).toEqual(p);
  for (const change of [
    { modelCode: 'CFI-TEST02' },
    { systemVersion: '3.00.00.09' },
    { computerOs: 'macos' as const },
    { homeScreen: 'no' as const },
  ]) {
    const updated = { ...basis, ...change };
    expect(readPreparation(JSON.stringify(p), updated)).toEqual(
      emptyPreparation(updated),
    );
  }
  for (const raw of [
    'broken',
    'null',
    JSON.stringify({ ...p, revision: 2 }),
    JSON.stringify({ ...p, addressLocated: false }),
  ])
    expect(readPreparation(raw, basis)).toEqual(emptyPreparation(basis));
  expect(
    preparationProgressSchema.safeParse({ ...emptyPreparation(basis), step: 3 })
      .success,
  ).toBe(false);
});
