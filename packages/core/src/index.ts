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
const version = z
  .string()
  .regex(/^\d{1,2}\.\d{2}$/, '请使用 00.00 格式的固件版本');
export const consoleModelSchema = z.object({
  id,
  code: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  edition: z.enum(['digital', 'disc', 'unknown']),
  description: z.string().min(1),
  isExample: z.boolean(),
});
export const firmwareSchema = z.object({ id, version, isExample: z.boolean() });
export const methodSchema = z.object({
  id,
  name: z.string().min(1),
  description: z.string().min(1),
  isExample: z.boolean(),
});
export const evidenceSchema = z.object({
  id,
  title: z.string().min(1),
  url: z.url(),
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
  evidenceIds: z.array(id),
  explanation: z.string().min(1),
  isExample: z.boolean(),
});
export const datasetSchema = z
  .object({
    models: z.array(consoleModelSchema),
    firmwares: z.array(firmwareSchema),
    methods: z.array(methodSchema),
    evidence: z.array(evidenceSchema),
    compatibility: z.array(compatibilitySchema),
  })
  .superRefine((data, ctx) => {
    for (const key of [
      'models',
      'firmwares',
      'methods',
      'evidence',
      'compatibility',
    ] as const) {
      if (new Set(data[key].map((x) => x.id)).size !== data[key].length)
        ctx.addIssue({ code: 'custom', path: [key], message: 'ID 不得重复' });
    }
    for (const record of data.compatibility) {
      const model = data.models.find((x) => x.id === record.modelId);
      const firmware = data.firmwares.find((x) => x.id === record.firmwareId);
      const method = data.methods.find((x) => x.id === record.methodId);
      if (
        !model ||
        !firmware ||
        !method ||
        record.evidenceIds.some((id) => !data.evidence.some((x) => x.id === id))
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['compatibility', record.id],
          message: '引用不存在',
        });
      }
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
        (e.kind === 'example' && e.verified)
      )
        ctx.addIssue({
          code: 'custom',
          path: ['evidence', e.id],
          message: '证据范围无效或示例被标为已验证',
        });
    }
  });
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
