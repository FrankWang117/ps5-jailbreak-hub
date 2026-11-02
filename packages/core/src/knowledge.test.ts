import { expect, it } from 'vitest';
import { knowledgeBaseSchema } from './knowledge';

function fixture() {
  return {
    articles: [
      {
        slug: 'guide',
        title: '测试文章',
        summary: '测试摘要',
        updatedAt: '2026-11-02',
        sections: [{ id: 'intro', title: '概述', paragraphs: ['测试内容'] }],
        sources: [
          {
            kind: 'official',
            title: '测试来源',
            publisher: '测试发布者',
            url: 'https://example.org/source',
            checkedAt: '2026-11-02',
            scope: '仅作测试',
          },
        ],
        relatedSlugs: [] as string[],
      },
    ],
  };
}
it('rejects broken article references and duplicate paths or anchors', () => {
  const data = fixture();
  expect(knowledgeBaseSchema.safeParse(data).success).toBe(true);
  data.articles[0].relatedSlugs = ['missing'];
  expect(knowledgeBaseSchema.safeParse(data).success).toBe(false);
  data.articles[0].relatedSlugs = [];
  data.articles[0].sections.push(data.articles[0].sections[0]);
  expect(knowledgeBaseSchema.safeParse(data).success).toBe(false);
  const duplicate = fixture();
  duplicate.articles.push(duplicate.articles[0]);
  expect(knowledgeBaseSchema.safeParse(duplicate).success).toBe(false);
});
it('requires dated, safe original sources and a consistent update date', () => {
  const data = fixture();
  data.articles[0].sources[0].url = 'javascript:alert(1)';
  expect(knowledgeBaseSchema.safeParse(data).success).toBe(false);
  data.articles[0].sources[0].url = 'https://example.org/source';
  data.articles[0].updatedAt = '2026-10-01';
  expect(knowledgeBaseSchema.safeParse(data).success).toBe(false);
  const missing = fixture();
  expect(
    knowledgeBaseSchema.safeParse({
      articles: [
        {
          ...missing.articles[0],
          sources: [{ ...missing.articles[0].sources[0], url: null }],
        },
      ],
    }).success,
  ).toBe(false);
});
