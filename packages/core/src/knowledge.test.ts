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

it('validates optional diagrams without requiring them on existing articles', () => {
  const data = fixture();
  const withDiagram = (diagram: unknown) => ({
    articles: [
      {
        ...data.articles[0],
        sections: [{ ...data.articles[0].sections[0], diagram }],
      },
    ],
  });
  const diagram = {
    label: '菜单路径',
    steps: ['设置', '主机信息'],
    caption: '本站示意，非实机截图',
  };
  expect(knowledgeBaseSchema.safeParse(data).success).toBe(true);
  expect(knowledgeBaseSchema.safeParse(withDiagram(diagram)).success).toBe(
    true,
  );
  expect(
    knowledgeBaseSchema.safeParse(withDiagram({ ...diagram, steps: [] }))
      .success,
  ).toBe(false);
  expect(
    knowledgeBaseSchema.safeParse(
      withDiagram({ ...diagram, steps: ['设置', ' '] }),
    ).success,
  ).toBe(false);
  expect(
    knowledgeBaseSchema.safeParse(withDiagram({ ...diagram, caption: '' }))
      .success,
  ).toBe(false);
});

it('requires original URLs for project and community sources and preserves revision metadata', () => {
  const data = fixture();
  for (const kind of ['project', 'community']) {
    const source = {
      ...data.articles[0].sources[0],
      kind,
      revision: '测试快照',
    };
    const withSource = (url: string | null) => ({
      articles: [{ ...data.articles[0], sources: [{ ...source, url }] }],
    });
    const valid = knowledgeBaseSchema.parse(
      withSource('https://example.org/research'),
    );
    expect(valid.articles[0].sources[0].revision).toBe('测试快照');
    expect(knowledgeBaseSchema.safeParse(withSource(null)).success).toBe(false);
    expect(
      knowledgeBaseSchema.safeParse(withSource('javascript:alert(1)')).success,
    ).toBe(false);
  }
});

it('validates optional command snippets as content without requiring them on other articles', () => {
  const data = fixture();
  const withSnippet = (snippet: unknown) => ({
    articles: [
      {
        ...data.articles[0],
        sections: [{ ...data.articles[0].sections[0], snippet }],
      },
    ],
  });
  const snippet = {
    label: '测试文本',
    language: 'shell',
    code: 'echo fixture',
  };
  expect(knowledgeBaseSchema.safeParse(data).success).toBe(true);
  expect(knowledgeBaseSchema.safeParse(withSnippet(snippet)).success).toBe(
    true,
  );
  expect(
    knowledgeBaseSchema.safeParse(withSnippet({ ...snippet, code: '' }))
      .success,
  ).toBe(false);
  expect(
    knowledgeBaseSchema.safeParse(withSnippet({ ...snippet, label: ' ' }))
      .success,
  ).toBe(false);
  expect(
    knowledgeBaseSchema.safeParse(
      withSnippet({ ...snippet, language: 'javascript' }),
    ).success,
  ).toBe(false);
});
