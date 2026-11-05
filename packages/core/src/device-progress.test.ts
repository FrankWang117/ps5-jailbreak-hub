import { expect, it } from 'vitest';
import {
  deviceProgressSchema,
  emptyDeviceProgress,
  readDeviceProgress,
  progressForAnswers,
} from './index';
it('rejects corrupt, future and impossible saved progress', () => {
  for (const raw of [
    'bad',
    'null',
    JSON.stringify({ ...emptyDeviceProgress(), revision: 2 }),
    JSON.stringify({ ...emptyDeviceProgress(), step: 3 }),
    JSON.stringify({ ...emptyDeviceProgress(), confirmed: true }),
  ]) {
    expect(readDeviceProgress(raw)).toEqual(emptyDeviceProgress());
  }
});
it('preserves raw version and requires explicit device confirmation prerequisites', () => {
  const p = {
    ...emptyDeviceProgress(),
    step: 3,
    confirmed: true,
    answers: {
      ...emptyDeviceProgress().answers,
      modelCode: 'CFI-TEST01',
      systemVersion: '03.00.00.09',
      homeScreen: 'yes' as const,
    },
  };
  expect(readDeviceProgress(JSON.stringify(p))).toEqual(p);
  expect(
    progressForAnswers(
      { ...p.answers, computer: 'yes', computerOs: 'windows' },
      p,
    ).confirmed,
  ).toBe(true);
  expect(
    progressForAnswers({ ...p.answers, modelCode: 'CFI-TEST02' }, p).confirmed,
  ).toBe(false);
  expect(
    deviceProgressSchema.safeParse({
      ...p,
      answers: { ...p.answers, homeScreen: 'no' },
    }).success,
  ).toBe(false);
  expect(
    deviceProgressSchema.safeParse({
      ...p,
      answers: { ...p.answers, systemVersion: 'version' },
    }).success,
  ).toBe(false);
});
