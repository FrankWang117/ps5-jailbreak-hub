import { describe, expect, it } from 'vitest';
import { datasetSchema, queryCompatibility, type Dataset } from './index';
function fixture(): Dataset {
  return datasetSchema.parse({
    models: [
      {
        id: 'm',
        code: 'CFI-TEST',
        name: 'test',
        region: 'test',
        edition: 'unknown',
        description: 'test',
        isExample: false,
      },
    ],
    modelSources: [
      {
        id: 'ms',
        modelId: 'm',
        title: 'Test fixture only',
        url: 'https://example.org/model',
        publisher: 'fixture',
        kind: 'primary',
        verified: true,
        checkedAt: '2026-11-02T00:00:00Z',
        summary: 'Test only',
        limitations: 'Not production',
        claims: [
          { field: 'code', value: 'CFI-TEST' },
          { field: 'name', value: 'test' },
          { field: 'region', value: 'test' },
        ],
      },
    ],
    firmwares: [{ id: 'f', version: '03.00', isExample: false }],
    methods: [{ id: 's', name: 'test', description: 'test', isExample: false }],
    evidence: [
      {
        id: 'e',
        title: 'test',
        url: 'https://example.org/source',
        publisher: 'test',
        kind: 'primary',
        verified: true,
        checkedAt: '2026-11-02T00:00:00Z',
        summary: 'test fixture only',
        scope: {
          modelId: 'm',
          firmwareId: 'f',
          methodId: 's',
          status: 'verified',
        },
      },
    ],
    compatibility: [
      {
        id: 'r',
        modelId: 'm',
        firmwareId: 'f',
        methodId: 's',
        status: 'verified',
        evidenceIds: ['e'],
        explanation: 'test only',
        isExample: false,
      },
    ],
  });
}
describe('evidence boundaries', () => {
  it('accepts an exact evidence-backed record', () =>
    expect(datasetSchema.safeParse(fixture()).success).toBe(true));
  it.each(['partial', 'researching', 'no_public_method'] as const)(
    'accepts %s only when exact status evidence matches',
    (status) => {
      const d = fixture();
      d.compatibility[0].status = status;
      if (status === 'partial') d.compatibility[0].limitations = ['测试限制'];
      d.evidence[0].scope.status = status;
      expect(datasetSchema.safeParse(d).success).toBe(true);
      d.evidence = [];
      expect(datasetSchema.safeParse(d).success).toBe(false);
    },
  );
  it('rejects unsupported claims and broken references', () => {
    const d = fixture();
    d.compatibility[0].evidenceIds = [];
    expect(datasetSchema.safeParse(d).success).toBe(false);
    d.compatibility[0].status = 'unknown';
    d.compatibility[0].modelId = 'absent';
    expect(datasetSchema.safeParse(d).success).toBe(false);
  });
  it('rejects example data as a source of verified claims', () => {
    const d = fixture();
    d.models[0].isExample = true;
    expect(datasetSchema.safeParse(d).success).toBe(false);
  });
  it('rejects wrong scope or status evidence', () => {
    const d = fixture();
    d.evidence[0].scope.status = 'partial';
    expect(datasetSchema.safeParse(d).success).toBe(false);
    d.evidence[0].scope.modelId = 'other';
    expect(datasetSchema.safeParse(d).success).toBe(false);
  });
  it('rejects duplicate IDs, invalid firmware and verified sample evidence', () => {
    const d = fixture();
    d.models.push(d.models[0]);
    expect(datasetSchema.safeParse(d).success).toBe(false);
    d.models.pop();
    d.firmwares[0].version = 'oops';
    expect(datasetSchema.safeParse(d).success).toBe(false);
    d.firmwares[0].version = '03.00';
    d.evidence[0].kind = 'example';
    expect(datasetSchema.safeParse(d).success).toBe(false);
  });
  it('does not extrapolate to lower or higher versions or other models', () => {
    for (const version of ['02.00', '04.00', '99.99'])
      expect(queryCompatibility(fixture(), 'm', version).records).toEqual([]);
    expect(queryCompatibility(fixture(), 'other', '03.00').records).toEqual([]);
  });
  it('uses exact string matches and trims whitespace', () => {
    expect(queryCompatibility(fixture(), 'm', ' 03.00 ').records).toHaveLength(
      1,
    );
    expect(queryCompatibility(fixture(), 'm', '3.00').records).toHaveLength(0);
  });
});

describe('M1 field sources and data integrity', () => {
  it('requires verified same-value sources for known model fields', () => {
    const d = fixture();
    d.modelSources = [];
    expect(datasetSchema.safeParse(d).success).toBe(false);
    const mismatch = fixture();
    mismatch.modelSources[0].claims[0].value = 'different';
    expect(datasetSchema.safeParse(mismatch).success).toBe(false);
    const unverified = fixture();
    unverified.modelSources[0].verified = false;
    expect(datasetSchema.safeParse(unverified).success).toBe(false);
  });
  it('rejects missing model source targets and sample verification flags', () => {
    const d = fixture();
    d.modelSources[0].modelId = 'absent';
    expect(datasetSchema.safeParse(d).success).toBe(false);
    const sample = fixture();
    sample.modelSources[0].kind = 'example';
    expect(datasetSchema.safeParse(sample).success).toBe(false);
  });
  it('does not use product facts as compatibility evidence', () => {
    const d = fixture();
    d.evidence = [];
    d.compatibility[0].evidenceIds = ['ms'];
    expect(datasetSchema.safeParse(d).success).toBe(false);
  });
  it('requires restrictions for partial records', () => {
    const d = fixture();
    d.compatibility[0].status = 'partial';
    d.evidence[0].scope.status = 'partial';
    expect(datasetSchema.safeParse(d).success).toBe(false);
    d.compatibility[0].limitations = ['Function X only'];
    expect(datasetSchema.safeParse(d).success).toBe(true);
  });
  it('rejects duplicate lookup keys and scope conflicts even when IDs differ', () => {
    const d = fixture();
    d.firmwares.push({ ...d.firmwares[0], id: 'f2' });
    expect(datasetSchema.safeParse(d).success).toBe(false);
    const conflict = fixture();
    conflict.compatibility.push({
      ...conflict.compatibility[0],
      id: 'r2',
      status: 'unknown',
      evidenceIds: [],
    });
    expect(datasetSchema.safeParse(conflict).success).toBe(false);
  });
  it('rejects irrelevant evidence attached alongside valid support', () => {
    const d = fixture();
    d.evidence.push({
      ...d.evidence[0],
      id: 'wrong',
      scope: { ...d.evidence[0].scope, status: 'unknown' },
    });
    d.compatibility[0].evidenceIds.push('wrong');
    expect(datasetSchema.safeParse(d).success).toBe(false);
  });
  it('rejects executable URL schemes in model and compatibility sources', () => {
    for (const key of ['modelSources', 'evidence'] as const) {
      const d = fixture();
      d[key][0].url = 'javascript:alert(1)';
      expect(datasetSchema.safeParse(d).success).toBe(false);
    }
  });
});

it('invalid URL strings fail validation without throwing', () => {
  const d = fixture();
  d.modelSources[0].url = 'not a URL';
  expect(() => datasetSchema.safeParse(d)).not.toThrow();
  expect(datasetSchema.safeParse(d).success).toBe(false);
});
