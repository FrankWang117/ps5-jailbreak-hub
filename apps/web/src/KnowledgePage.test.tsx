import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { knowledgeBase } from '@ps5/data';
import App from './App';

afterEach(cleanup);
it('opens the library from home and reads existing article sources', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('link', { name: /浏览入门知识/ }));
  const title = screen.getByRole('heading', {
    level: 1,
    name: '中文入门知识库',
  });
  expect(document.activeElement).toBe(title);
  await user.click(
    screen.getByRole('link', { name: /型号与固件：先读对主机信息/ }),
  );
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: '型号与固件：先读对主机信息',
    }),
  ).toBe(document.activeElement);
  const toc = screen.getByRole('complementary', { name: '本文目录' });
  expect(
    within(toc)
      .getByRole('link', { name: '完整版本与短版本不能自行换算' })
      .getAttribute('href'),
  ).toBe('#exact-version');
  expect(screen.getByText(/不能截取其中一段/)).toBeTruthy();
  expect(screen.getAllByText('官方资料')).toHaveLength(2);
  expect(screen.getByText('本站规则')).toBeTruthy();
});
it.each(knowledgeBase.articles.map((article) => [article.slug, article.title]))(
  'supports direct article access: %s',
  (slug, title) => {
    render(
      <MemoryRouter initialEntries={[`/knowledge/${slug}`]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: '来源与适用范围' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('complementary', { name: '相关阅读' }),
    ).toBeTruthy();
    for (const link of screen
      .getAllByRole('link')
      .filter((item) => item.getAttribute('target') === '_blank')) {
      const article = knowledgeBase.articles.find(
        (item) => item.slug === slug,
      )!;
      expect(article.sources.map((source) => source.url)).toContain(
        link.getAttribute('href'),
      );
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
      expect(link.getAttribute('rel')).toContain('noreferrer');
    }
  },
);
it('links unknown query results to evidence guidance and recovers from unknown article paths', async () => {
  const user = userEvent.setup();
  const view = render(
    <MemoryRouter initialEntries={['/compatibility']}>
      <App />
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText('系统固件版本'), '03.00');
  await user.click(screen.getByRole('button', { name: /查询兼容性/ }));
  expect(screen.getByText('兼容性未知')).toBeTruthy();
  await user.click(
    screen.getByRole('link', { name: /五种状态与证据：如何读查询结果/ }),
  );
  expect(screen.getByText(/数据库没有记录时也属于未知/)).toBeTruthy();
  await user.click(screen.getByRole('link', { name: '返回正式兼容性查询 →' }));
  expect(screen.getByText('等待你的查询')).toBeTruthy();
  view.unmount();
  render(
    <MemoryRouter initialEntries={['/knowledge/missing']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: '文章不存在' })).toBeTruthy();
  await user.click(screen.getByRole('link', { name: '返回知识库目录' }));
  expect(screen.getByRole('heading', { name: '中文入门知识库' })).toBeTruthy();
});

it('takes a first-time user from home to version guidance and a clean formal query', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  const start = screen.getByRole('link', { name: /第一次开机，从这里开始/ });
  start.focus();
  await user.keyboard('{Enter}');
  expect(document.activeElement).toBe(
    screen.getByRole('heading', {
      level: 1,
      name: '第一次开机：先确认型号与系统版本',
    }),
  );
  expect(screen.getByText(/12.40 只是规划假设/)).toBeTruthy();
  expect(screen.getByText(/本文不保证按钮名称/)).toBeTruthy();
  expect(screen.getByText(/不要拔电或强行关机/)).toBeTruthy();
  expect(
    screen.getByRole('figure', { name: '查找系统版本的日语菜单路径' }),
  ).toBeTruthy();
  expect(screen.getByText('本体情報 / 主机信息')).toBeTruthy();
  expect(screen.getByText(/没有经过核验的转换规则/)).toBeTruthy();
  await user.click(
    screen.getByRole('link', { name: '带着实际版本，去正式查询 →' }),
  );
  const input = screen.getByLabelText('系统固件版本') as HTMLInputElement;
  expect(input.value).toBe('');
  await user.type(input, '12.40');
  await user.keyboard('{Enter}');
  expect(screen.getByText('兼容性未知')).toBeTruthy();
  await user.click(screen.getByRole('link', { name: /不知道版本在哪里/ }));
  expect(document.activeElement?.id).toBe('find-system-version');
  expect(
    screen.getByRole('heading', { name: '06 · 打开主机信息，照原样记录' }),
  ).toBeTruthy();
});

it('reads researched routes separately from model compatibility and distinguishes source kinds', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/knowledge/first-boot']}>
      <App />
    </MemoryRouter>,
  );
  const route = screen.getByRole('link', {
    name: '假设是 12.40：先看适用路线与准备条件',
  });
  route.focus();
  await user.keyboard('{Enter}');
  expect(document.activeElement).toBe(
    screen.getByRole('heading', {
      level: 1,
      name: '假设是 12.40：先看适用路线与准备条件',
    }),
  );
  expect(screen.getAllByText('项目一手资料').length).toBeGreaterThan(0);
  expect(screen.getByText('社区报告')).toBeTruthy();
  expect(screen.queryByText('官方资料')).toBeNull();
  expect(screen.getByText(/12.40 仍是假设/)).toBeTruthy();
  expect(screen.getByText(/不自动改成 12.20 或 12.40/)).toBeTruthy();
  expect(screen.getByText(/不要再重复加载另一份 kstuff/)).toBeTruthy();
  expect(screen.getByText(/版本 \/ 快照：tag v2.5B-unified.1/)).toBeTruthy();
  expect(screen.getByRole('figure', { name: '能力层级示意' })).toBeTruthy();
  await user.click(screen.getByRole('link', { name: '返回正式兼容性查询 →' }));
  expect(
    (screen.getByLabelText('系统固件版本') as HTMLInputElement).value,
  ).toBe('');
  await user.type(screen.getByLabelText('系统固件版本'), '12.40');
  await user.keyboard('{Enter}');
  expect(screen.getByText('兼容性未知')).toBeTruthy();
  expect(screen.getByText('0 条方案记录')).toBeTruthy();
});
