import { z } from 'zod';

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z][a-z0-9-]*$/);
const sourceSchema = z
  .object({
    kind: z.enum(['official', 'editorial']),
    title: text,
    publisher: text,
    url: z
      .url()
      .refine((value) => /^https?:\/\//i.test(value))
      .nullable(),
    checkedAt: z.iso.date(),
    scope: text,
  })
  .superRefine((source, ctx) => {
    if (source.kind === 'official' && source.url === null)
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: '官方来源必须有原文链接',
      });
  });
export const knowledgeBaseSchema = z
  .object({
    articles: z
      .array(
        z.object({
          slug,
          title: text,
          summary: text,
          updatedAt: z.iso.date(),
          sections: z
            .array(
              z.object({
                id: slug,
                title: text,
                paragraphs: z.array(text).min(1),
                diagram: z
                  .object({
                    label: text,
                    steps: z.array(text).min(2).max(8),
                    caption: text,
                  })
                  .optional(),
              }),
            )
            .min(1),
          sources: z.array(sourceSchema).min(1),
          relatedSlugs: z.array(slug),
        }),
      )
      .min(1),
  })
  .superRefine(({ articles }, ctx) => {
    if (
      new Set(articles.map((article) => article.slug)).size !== articles.length
    )
      ctx.addIssue({
        code: 'custom',
        path: ['articles'],
        message: '文章路径不得重复',
      });
    articles.forEach((article, index) => {
      if (
        new Set(article.sections.map((section) => section.id)).size !==
        article.sections.length
      )
        ctx.addIssue({
          code: 'custom',
          path: ['articles', index, 'sections'],
          message: '章节锚点不得重复',
        });
      if (
        new Set(article.relatedSlugs).size !== article.relatedSlugs.length ||
        article.relatedSlugs.some(
          (related) =>
            related === article.slug ||
            !articles.some((item) => item.slug === related),
        )
      )
        ctx.addIssue({
          code: 'custom',
          path: ['articles', index, 'relatedSlugs'],
          message: '相关阅读必须引用其他现有文章且不重复',
        });
      if (
        article.sources.some((source) => source.checkedAt > article.updatedAt)
      )
        ctx.addIssue({
          code: 'custom',
          path: ['articles', index, 'updatedAt'],
          message: '更新时间不能早于来源核验时间',
        });
    });
  });
export type KnowledgeArticle = z.infer<
  typeof knowledgeBaseSchema
>['articles'][number];
