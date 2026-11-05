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
// 仅约束输入格式，不证明该编号是真实型号。
export const modelCodeInputSchema = z.string().regex(/^CFI-[A-Z0-9-]{4,16}$/);
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

/** 按完整型号编号查找；未收录编号不继承其他型号。 */
export function queryCompatibilityByModelCode(
  input: Dataset,
  modelCode: string,
  firmwareVersion: string,
) {
  const model = input.models.find((item) => item.code === modelCode.trim());
  // 空 ID 不可能匹配合法记录；不把输入文字当成内部 ID 或型号系列。
  return queryCompatibility(input, model?.id ?? '', firmwareVersion);
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

export { knowledgeBaseSchema, type KnowledgeArticle } from './knowledge';

/** 保留用户照抄的版本；仅短版本可直接查询现有兼容性目录。 */
export const systemVersionInputSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(
    /^\d{1,4}(?:[.-]\d{1,4})+$/,
    '请照抄设备显示的数字版本，可包含点和短横线',
  );

export function captureSystemVersion(raw: string) {
  const original = systemVersionInputSchema.parse(raw);
  return firmwareVersionSchema.safeParse(original).success
    ? { kind: 'exact' as const, original, lookupVersion: original }
    : { kind: 'unmapped' as const, original, lookupVersion: null };
}

const answer = z.enum(['unknown', 'yes', 'no']);
export const guideAnswersSchema = z.object({
  modelCode: z
    .string()
    .trim()
    .refine((v) => !v || modelCodeInputSchema.safeParse(v).success),
  systemVersion: z
    .string()
    .trim()
    .refine((v) => !v || systemVersionInputSchema.safeParse(v).success),
  homeScreen: answer,
  computer: answer,
  computerOs: z.enum(['unknown', 'macos', 'windows', 'linux', 'other']),
});
export type GuideAnswers = z.infer<typeof guideAnswersSchema>;

/** 准备建议只依赖明确回答与精确记录，不按固件大小/型号系列选择执行路线。 */
export function assessGuideReadiness(input: Dataset, raw: GuideAnswers) {
  const data = publishedDatasetSchema.parse(input);
  const answers = guideAnswersSchema.parse(raw);
  const version = answers.systemVersion
    ? captureSystemVersion(answers.systemVersion)
    : null;
  const records =
    answers.modelCode && version?.kind === 'exact'
      ? queryCompatibilityByModelCode(
          data,
          answers.modelCode,
          version.lookupVersion,
        ).records
      : [];
  const evidence =
    version?.kind === 'unmapped'
      ? ('unmapped' as const)
      : records.some((r) => r.status === 'verified' || r.status === 'partial')
        ? ('found' as const)
        : ('missing' as const);
  const missing: Array<
    | 'model'
    | 'version'
    | 'home-screen'
    | 'version-mapping'
    | 'computer'
    | 'computer-os'
    | 'compatibility'
  > = [];
  if (!answers.modelCode) missing.push('model');
  if (!version) missing.push('version');
  if (answers.homeScreen !== 'yes') missing.push('home-screen');
  if (version?.kind === 'unmapped') missing.push('version-mapping');
  if (answers.computer !== 'yes') missing.push('computer');
  if (answers.computer === 'yes' && answers.computerOs === 'unknown')
    missing.push('computer-os');
  if (evidence !== 'found') missing.push('compatibility');
  const stage = missing.some(
    (v) => v === 'model' || v === 'version' || v === 'home-screen',
  )
    ? 'device-info'
    : evidence === 'unmapped'
      ? 'version-review'
      : answers.computer !== 'yes'
        ? 'computer-check'
        : answers.computerOs === 'unknown'
          ? 'os-check'
          : evidence === 'found'
            ? 'evidence-review'
            : 'preparation-reading';
  return {
    answers,
    version,
    evidence,
    missing,
    stage,
    executionReady: false as const,
  } as const;
}

/** 仅在本站链接中携带明示回答；未回答项保持未知。 */
export function guideAnswersFromSearch(search: string): GuideAnswers {
  const params = new URLSearchParams(search);
  const parsed = guideAnswersSchema.safeParse({
    modelCode: params.get('model') ?? '',
    systemVersion: params.get('version') ?? '',
    homeScreen: params.get('homeScreen') ?? 'unknown',
    computer: params.get('computer') ?? 'unknown',
    computerOs: params.get('computerOs') ?? 'unknown',
  });
  // 分字段解析，坏链接不会抹掉其他合法的原始信息。
  if (parsed.success) return parsed.data;
  const model = params.get('model') ?? '';
  const version = params.get('version') ?? '';
  return {
    modelCode: modelCodeInputSchema.safeParse(model).success ? model : '',
    systemVersion: systemVersionInputSchema.safeParse(version).success
      ? version
      : '',
    homeScreen: answer.safeParse(params.get('homeScreen')).success
      ? (params.get('homeScreen') as GuideAnswers['homeScreen'])
      : 'unknown',
    computer: answer.safeParse(params.get('computer')).success
      ? (params.get('computer') as GuideAnswers['computer'])
      : 'unknown',
    computerOs: guideAnswersSchema.shape.computerOs.safeParse(
      params.get('computerOs'),
    ).success
      ? (params.get('computerOs') as GuideAnswers['computerOs'])
      : 'unknown',
  };
}
export function guideSearch(answers: GuideAnswers) {
  const parsed = guideAnswersSchema.parse(answers);
  return `?${new URLSearchParams({
    model: parsed.modelCode,
    version: parsed.systemVersion,
    homeScreen: parsed.homeScreen,
    computer: parsed.computer,
    computerOs: parsed.computer === 'yes' ? parsed.computerOs : 'unknown',
  }).toString()}`;
}

/** 仅保存用户明确填写的进度，不等于设备验证或兼容性证据。 */
export const deviceProgressSchema = z
  .object({
    revision: z.literal(1),
    step: z.number().int().min(0).max(3),
    answers: guideAnswersSchema,
    confirmed: z.boolean(),
  })
  .superRefine((progress, ctx) => {
    const a = progress.answers;
    if (
      (progress.step > 0 && !a.modelCode) ||
      (progress.step > 1 && a.homeScreen !== 'yes') ||
      (progress.step > 2 && !a.systemVersion) ||
      (progress.confirmed &&
        (progress.step !== 3 ||
          !a.modelCode ||
          !a.systemVersion ||
          a.homeScreen !== 'yes'))
    ) {
      ctx.addIssue({ code: 'custom', message: '进度缺少前置确认' });
    }
  });
export type DeviceProgress = z.infer<typeof deviceProgressSchema>;
export function emptyDeviceProgress(): DeviceProgress {
  return {
    revision: 1,
    step: 0,
    confirmed: false,
    answers: {
      modelCode: '',
      systemVersion: '',
      homeScreen: 'unknown',
      computer: 'unknown',
      computerOs: 'unknown',
    },
  };
}
export function readDeviceProgress(raw: string | null): DeviceProgress {
  try {
    const parsed = deviceProgressSchema.safeParse(JSON.parse(raw ?? 'null'));
    return parsed.success ? parsed.data : emptyDeviceProgress();
  } catch {
    return emptyDeviceProgress();
  }
}
export function progressForAnswers(
  answers: GuideAnswers,
  previous?: DeviceProgress,
): DeviceProgress {
  const valid = guideAnswersSchema.parse(answers);
  return deviceProgressSchema.parse({
    revision: 1,
    confirmed:
      previous?.confirmed === true &&
      previous.answers.modelCode === valid.modelCode &&
      previous.answers.systemVersion === valid.systemVersion &&
      previous.answers.homeScreen === valid.homeScreen,
    answers: valid,
    step: !valid.modelCode
      ? 0
      : valid.homeScreen !== 'yes'
        ? 1
        : !valid.systemVersion
          ? 2
          : 3,
  });
}

const preparationText = z.string().trim().min(1);
const preparationStep = z.object({
  title: preparationText,
  action: preparationText,
  expected: preparationText,
  help: preparationText,
});
const preparationPlatform = z.object({
  label: preparationText,
  instructions: z.array(preparationText).min(1),
  menuVerified: z.boolean(),
});
export const preparationContentSchema = z.object({
  updatedAt: z.iso.date(),
  steps: z.tuple([
    preparationStep,
    preparationStep,
    preparationStep,
    preparationStep,
  ]),
  platforms: z.object({
    macos: preparationPlatform,
    windows: preparationPlatform,
    linux: preparationPlatform,
    other: preparationPlatform,
  }),
  sources: z
    .array(
      z.object({
        title: preparationText,
        publisher: preparationText,
        url: z.url().refine((v) => v.startsWith('https://')),
        checkedAt: z.iso.date(),
        scope: preparationText,
      }),
    )
    .min(1),
});
export const preparationProgressSchema = z
  .object({
    revision: z.literal(1),
    basis: guideAnswersSchema,
    step: z.number().int().min(0).max(3),
    addressLocated: z.boolean(),
    networkPlanned: z.boolean(),
    settingsRecorded: z.boolean(),
    confirmed: z.boolean(),
  })
  .superRefine((p, ctx) => {
    if (
      (p.step > 0 &&
        (p.basis.computer !== 'yes' || p.basis.computerOs === 'unknown')) ||
      (p.step > 1 && !p.addressLocated) ||
      (p.step > 2 && (!p.networkPlanned || !p.settingsRecorded)) ||
      (p.confirmed && p.step !== 3)
    )
      ctx.addIssue({ code: 'custom', message: '准备进度缺少前置回答' });
  });
export type PreparationProgress = z.infer<typeof preparationProgressSchema>;
export function emptyPreparation(basis: GuideAnswers): PreparationProgress {
  return {
    revision: 1,
    basis: guideAnswersSchema.parse(basis),
    step: 0,
    addressLocated: false,
    networkPlanned: false,
    settingsRecorded: false,
    confirmed: false,
  };
}
export function readPreparation(
  raw: string | null,
  basis: GuideAnswers,
): PreparationProgress {
  try {
    const saved = preparationProgressSchema.safeParse(
      JSON.parse(raw ?? 'null'),
    );
    const current = guideAnswersSchema.parse(basis);
    if (
      saved.success &&
      (Object.keys(current) as Array<keyof GuideAnswers>).every(
        (k) => saved.data.basis[k] === current[k],
      )
    )
      return saved.data;
  } catch {
    /* 存储损坏时从当前设备的空白准备进度开始。 */
  }
  return emptyPreparation(basis);
}
export function assessPreparation(p: PreparationProgress) {
  const valid = preparationProgressSchema.parse(p);
  const pending =
    valid.step === 0
      ? valid.basis.computer !== 'yes'
        ? 'computer'
        : valid.basis.computerOs === 'unknown'
          ? 'os'
          : null
      : valid.step === 1
        ? !valid.addressLocated
          ? 'address'
          : null
        : valid.step === 2
          ? !valid.networkPlanned
            ? 'network'
            : !valid.settingsRecorded
              ? 'settings'
              : null
          : null;
  return {
    pending,
    canAdvance: pending === null,
    executionReady: false as const,
  };
}

/** 出厂批次参考独立于正式兼容性；匹配只返回社区表中已核查的候选版本。 */
export function captureFactoryPrefix(raw: string) {
  const normalized = raw.trim().toUpperCase();
  const hasPrefix = /^S01[-\u2010-\u2015\uFF0D]/.test(normalized);
  const suffix = hasPrefix ? normalized.slice(4) : normalized;
  // 仅识别明确的 S01- 前缀；不能将其他格式的完整编号静默截成批次。
  if (!/^[A-Z0-9]*$/.test(suffix) || (!hasPrefix && suffix.length > 4))
    return { kind: 'invalid' as const };
  return {
    kind: 'accepted' as const,
    suffix: suffix.slice(0, 4),
    truncated: suffix.length > 4,
    hasPrefix,
  };
}
export const factoryPrefixSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^S01-[A-Z][0-9A-C]{3}$/,
    '只填写 S01- 开头的前 8 位，不填写完整序列号',
  );
export const factoryDatasetSchema = z
  .object({
    updatedAt: z.iso.date(),
    sources: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          url: z.url().refine((v) => v.startsWith('https://')),
          publisher: z.string().min(1),
          kind: z.literal('community'),
          reviewed: z.literal(true),
          checkedAt: z.iso.date(),
          revision: z.string().min(1),
          limitations: z.string().min(1),
        }),
      )
      .min(1),
    records: z.array(
      z.object({
        id: z.string().min(1),
        family: z.string().regex(/^CFI-\d{2}$/),
        prefixes: z.array(factoryPrefixSchema).min(1),
        period: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),
        versions: z.array(systemVersionInputSchema).min(1),
        sourceId: z.string().min(1),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    const ids = new Set<string>();
    const prefixes = new Set<string>();
    if (new Set(data.sources.map((s) => s.id)).size !== data.sources.length)
      ctx.addIssue({ code: 'custom', message: '来源 ID 重复' });
    data.sources.forEach((s) => {
      if (s.checkedAt > data.updatedAt)
        ctx.addIssue({ code: 'custom', message: '来源核验晚于目录更新' });
    });
    data.records.forEach((r) => {
      if (ids.has(r.id))
        ctx.addIssue({ code: 'custom', message: '批次 ID 重复' });
      ids.add(r.id);
      if (!data.sources.some((s) => s.id === r.sourceId))
        ctx.addIssue({ code: 'custom', message: '批次缺少已核查来源' });
      if (new Set(r.versions).size !== r.versions.length)
        ctx.addIssue({ code: 'custom', message: '候选版本重复' });
      for (const p of r.prefixes) {
        if (prefixes.has(p))
          ctx.addIssue({ code: 'custom', message: '批次前缀重复' });
        prefixes.add(p);
      }
    });
  });
export type FactoryDataset = z.infer<typeof factoryDatasetSchema>;
export const siteContentSchema = z.object({
  release: z.string().regex(/^\d+\.\d+\.\d+-beta\.\d+$/),
  feedbackUrl: z.url().refine((url) => url.startsWith('https://')),
  feedbackCheckedAt: z.iso.date(),
});
export function queryFactoryReference(
  raw: FactoryDataset,
  input: { kind: 'model' | 'serial'; value: string },
) {
  const data = factoryDatasetSchema.parse(raw);
  const value =
    input.kind === 'model'
      ? modelCodeInputSchema.parse(input.value.trim().toUpperCase())
      : factoryPrefixSchema.parse(input.value);
  const family =
    input.kind === 'model'
      ? /^CFI-(\d{2})\d{2}[AB][A-Z0-9-]*$/.exec(value)?.[1]
      : null;
  const records = data.records.filter((r) =>
    input.kind === 'serial'
      ? r.prefixes.includes(value)
      : family !== null && family !== undefined && r.family === `CFI-${family}`,
  );
  return {
    kind: input.kind,
    matched: records.length > 0,
    records,
    compatibility: 'unknown' as const,
  };
}

export {
  siteLocationSchema,
  parseSiteLocation,
  publicSiteRoot,
  type SiteLocation,
} from './site-location';
