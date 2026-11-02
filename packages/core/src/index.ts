import { z } from 'zod';

export const statusLabels = {
  verified: '已验证',
  partial: '部分可用',
  researching: '研究中',
  no_public_method: '暂无公开方案',
  unknown: '未知',
} as const;
export const compatibilityStatusSchema = z.enum([
  'verified',
  'partial',
  'researching',
  'no_public_method',
  'unknown',
]);
const id = z.string().min(1);
export const firmwareVersionSchema = z
  .string()
  .regex(/^\d{1,2}\.\d{2}$/, '请使用 00.00 格式的固件版本');
export const consoleModelSchema = z.object({
  id,
  code: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  edition: z.enum(['digital', 'disc', 'unknown']),
  description: z.string().min(1),
  language: z.string().min(1).default('未知'),
  storage: z.string().min(1).default('未知'),
  releaseDate: z.iso.date().nullable().default(null),
  factoryFirmware: z.string().min(1).nullable().default(null),
  isExample: z.boolean(),
});
export const firmwareSchema = z.object({
  id,
  version: firmwareVersionSchema,
  isExample: z.boolean(),
});
export const methodSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string().min(1),
  isExample: z.boolean(),
});

const sourceUrl = z
  .url()
  .refine((value) => /^https?:\/\//i.test(value), '来源仅允许 HTTP(S) URL');
export const modelFieldLabels = {
  code: '型号',
  name: '名称',
  region: '销售地区',
  edition: '版本',
  language: '系统语言',
  storage: '标称存储',
  releaseDate: '发售日期',
  factoryFirmware: '出厂固件',
} as const;
export const modelSourceSchema = z.object({
  id,
  modelId: id,
  title: z.string().min(1),
  url: sourceUrl,
  publisher: z.string().min(1),
  kind: z.enum(['primary', 'reproduction', 'example']),
  verified: z.boolean(),
  checkedAt: z.iso.datetime(),
  summary: z.string().min(1),
  limitations: z.string().min(1),
  claims: z
    .array(
      z.object({
        field: z.enum([
          'code',
          'name',
          'region',
          'edition',
          'language',
          'storage',
          'releaseDate',
          'factoryFirmware',
        ]),
        value: z.string().min(1),
      }),
    )
    .min(1),
});

export const evidenceSchema = z.object({
  id,
  title: z.string().min(1),
  url: sourceUrl,
  publisher: z.string().min(1),
  kind: z.enum(['primary', 'reproduction', 'example']),
  verified: z.boolean(),
  checkedAt: z.iso.datetime(),
  summary: z.string().min(1),
  scope: z.object({
    modelId: id,
    firmwareId: id,
    methodId: id,
    status: compatibilityStatusSchema,
  }),
});
export const compatibilitySchema = z.object({
  id,
  modelId: id,
  firmwareId: id,
  methodId: id,
  status: compatibilityStatusSchema,
  limitations: z.array(z.string().min(1)).default([]),
  evidenceIds: z.array(id),
  explanation: z.string().min(1),
  isExample: z.boolean(),
});
export const datasetSchema = z
  .object({
    models: z.array(consoleModelSchema),
    modelSources: z.array(modelSourceSchema).default([]),
    firmwares: z.array(firmwareSchema),
    methods: z.array(methodSchema),
    evidence: z.array(evidenceSchema),
    compatibility: z.array(compatibilitySchema),
  })
  .superRefine((data, ctx) => {
    for (const key of [
      'models',
      'modelSources',
      'firmwares',
      'methods',
      'evidence',
      'compatibility',
    ] as const) {
      if (new Set(data[key].map((x) => x.id)).size !== data[key].length)
        ctx.addIssue({ code: 'custom', path: [key], message: 'ID 不得重复' });
    }

    for (const [key, values] of [
      ['models.code', data.models.map((x) => x.code)],
      ['firmwares.version', data.firmwares.map((x) => x.version)],
      [
        'compatibility.scope',
        data.compatibility.map((x) =>
          JSON.stringify([x.modelId, x.firmwareId, x.methodId]),
        ),
      ],
    ] as const) {
      if (new Set(values).size !== values.length)
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: '精确查询键不得重复',
        });
    }
    for (const source of data.modelSources) {
      const model = data.models.find((x) => x.id === source.modelId);
      if (
        !model ||
        (source.kind === 'example' && source.verified) ||
        (model.isExample && source.verified) ||
        source.claims.some((c) => model[c.field] !== c.value)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['modelSources', source.id],
          message: '型号来源引用、字段值或核验标记无效',
        });
      }
    }
    for (const model of data.models.filter((x) => !x.isExample)) {
      for (const field of Object.keys(
        modelFieldLabels,
      ) as (keyof typeof modelFieldLabels)[]) {
        const value = model[field];
        if (
          value !== null &&
          value !== 'unknown' &&
          value !== '未知' &&
          !data.modelSources.some(
            (source) =>
              source.modelId === model.id &&
              source.verified &&
              source.kind !== 'example' &&
              source.claims.some((c) => c.field === field && c.value === value),
          )
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['models', model.id, field],
            message: '真实型号的已知字段必须有关联且已核验的同值来源',
          });
        }
      }
    }
    for (const record of data.compatibility) {
      const model = data.models.find((x) => x.id === record.modelId);
      const firmware = data.firmwares.find((x) => x.id === record.firmwareId);
      const method = data.methods.find((x) => x.id === record.methodId);
      if (
        !model ||
        !firmware ||
        !method ||
        record.evidenceIds.some(
          (id) =>
            !data.evidence.some(
              (x) =>
                x.id === id &&
                x.scope.modelId === record.modelId &&
                x.scope.firmwareId === record.firmwareId &&
                x.scope.methodId === record.methodId &&
                x.scope.status === record.status,
            ),
        )
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['compatibility', record.id],
          message: '兼容性引用不存在或证据范围/状态不匹配',
        });
      }
      if (record.status === 'partial' && record.limitations.length === 0)
        ctx.addIssue({
          code: 'custom',
          path: ['compatibility', record.id, 'limitations'],
          message: '部分可用必须注明限制',
        });
      if (
        record.status !== 'unknown' &&
        (record.isExample ||
          model?.isExample ||
          firmware?.isExample ||
          method?.isExample ||
          !record.evidenceIds.some((id) => {
            const e = data.evidence.find((x) => x.id === id);
            return (
              e?.verified &&
              e.kind !== 'example' &&
              e.scope.modelId === record.modelId &&
              e.scope.firmwareId === record.firmwareId &&
              e.scope.methodId === record.methodId &&
              e.scope.status === record.status
            );
          }))
      )
        ctx.addIssue({
          code: 'custom',
          path: ['compatibility', record.id],
          message:
            '非 unknown 结论必须有同型号、同固件、同方案、同状态的可靠证据，示例不得作结论',
        });
    }
    for (const e of data.evidence) {
      if (
        !data.models.some((x) => x.id === e.scope.modelId) ||
        !data.firmwares.some((x) => x.id === e.scope.firmwareId) ||
        !data.methods.some((x) => x.id === e.scope.methodId) ||
        (e.verified &&
          (e.kind === 'example' ||
            data.models.some((x) => x.id === e.scope.modelId && x.isExample) ||
            data.firmwares.some(
              (x) => x.id === e.scope.firmwareId && x.isExample,
            ) ||
            data.methods.some((x) => x.id === e.scope.methodId && x.isExample)))
      )
        ctx.addIssue({
          code: 'custom',
          path: ['evidence', e.id],
          message: '证据范围无效或示例被标为已验证',
        });
    }
  });
export type ModelSource = z.infer<typeof modelSourceSchema>;
export type ConsoleModel = z.infer<typeof consoleModelSchema>;
export type Firmware = z.infer<typeof firmwareSchema>;
export type Method = z.infer<typeof methodSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Compatibility = z.infer<typeof compatibilitySchema>;
export type CompatibilityStatus = z.infer<typeof compatibilityStatusSchema>;
export type Dataset = z.infer<typeof datasetSchema>;

/** 精确匹配；绝不比较版本大小或跨机型继承结论。 */
export function queryCompatibility(
  input: Dataset,
  modelId: string,
  firmwareVersion: string,
) {
  const data = datasetSchema.parse(input);
  const firmware = data.firmwares.find(
    (x) => x.version === firmwareVersion.trim(),
  );
  const records = firmware
    ? data.compatibility.filter(
        (x) => x.modelId === modelId && x.firmwareId === firmware.id,
      )
    : [];
  return {
    records,
    reason: records.length
      ? '仅展示该型号与固件的精确匹配记录。'
      : '没有此型号与固件的可靠兼容性记录，不能据此判断破解能力。',
    fallbackStatus: 'unknown' as const,
  };
}

/** 发布目录禁止包含示例；独立于人工证据真实性审核。 */
export const publishedDatasetSchema = datasetSchema.superRefine((data, ctx) => {
  for (const key of [
    'models',
    'firmwares',
    'methods',
    'compatibility',
  ] as const) {
    if (data[key].some((x) => x.isExample))
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: '正式目录不得包含示例实体',
      });
  }
  for (const key of ['modelSources', 'evidence'] as const) {
    if (data[key].some((x) => x.kind === 'example'))
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: '正式目录不得包含示例来源',
      });
  }
});
