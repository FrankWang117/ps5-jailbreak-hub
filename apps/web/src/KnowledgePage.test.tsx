import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { knowledgeBase } from '@ps5/data';
import App from './App';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
it.each(knowledgeBase.articles.map((article) => [article.slug, article.title]))(
  'supports direct article access and expandable original sources: %s',
  async (slug, title) => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={[`/knowledge/${slug}`]}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: title })).toBe(
      document.activeElement,
    );
    if (slug === 'choosing-a-route')
      await user.click(screen.getByText('路线原理与来源（按需阅读）'));
    const sourceToggle = screen.getByText('来源与适用范围', {
      selector: 'summary',
    });
    expect(sourceToggle.parentElement?.hasAttribute('open')).toBe(false);
    await user.click(sourceToggle);
    expect(
      screen.getByRole('heading', { name: '来源与适用范围' }),
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
    expect(
      screen.getByRole('complementary', { name: '相关阅读' }),
    ).toBeTruthy();
  },
);

it('offers a general first-boot guide and keeps the first-user case optional', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  const start = screen.getByRole('link', { name: /开始确认我的设备/ });
  start.focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('heading', { name: '记录机身型号' })).toBe(
    document.activeElement,
  );
  await user.click(
    screen.getByRole('link', { name: '完整指南、适用范围与来源 →' }),
  );
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: '第一次开机：确认型号与版本',
    }),
  ).toBe(document.activeElement);
  expect(screen.getByText(/适用于准备确认设备信息的 PS5 用户/)).toBeTruthy();
  expect(screen.getByText(/不要拔电或强行关机/)).toBeTruthy();
  const example = screen.getByText('型号示例：CFI-2200B01（日语专用）', {
    selector: 'summary',
  });
  expect(example.parentElement?.hasAttribute('open')).toBe(false);
  await user.click(example);
  expect(example.parentElement?.hasAttribute('open')).toBe(true);
  expect(screen.getByText(/12.40 只是研究假设/)).toBeTruthy();
  await user.click(
    screen.getByRole('link', { name: '带着实际版本，去正式查询 →' }),
  );
  expect((screen.getByLabelText('主机型号') as HTMLInputElement).value).toBe(
    '',
  );
  expect(
    (screen.getByLabelText('系统固件版本') as HTMLInputElement).value,
  ).toBe('');
});

it('preserves the old route URL while making the reading path model-neutral', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/knowledge/firmware-1240-routes']}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('heading', { level: 1, name: '选择路线：先核对条件' }),
  ).toBeTruthy();
  const path = screen.getByRole('navigation', { name: '新手阅读路径' });
  await user.click(
    within(path).getByText(/阅读路径 ·/, { selector: 'summary' }),
  );
  expect(
    within(path).getByRole('link', { name: '路线说明' }).getAttribute('href'),
  ).toBe('/knowledge/choosing-a-route');
  expect(within(path).getAllByRole('link')).toHaveLength(6);
  await user.type(screen.getByLabelText('主机型号（可留空）'), 'CFI-TEST01');
  await user.type(screen.getByLabelText('版本原文（可留空）'), '09.00');
  await user.selectOptions(
    screen.getByLabelText('能进入主机主界面吗？'),
    'yes',
  );
  await user.selectOptions(screen.getByLabelText('有可用电脑吗？'), 'yes');
  await user.selectOptions(
    screen.getByLabelText('电脑使用什么系统？'),
    'macos',
  );
  await user.click(screen.getByRole('button', { name: '查看我的下一步' }));
  await user.click(screen.getByRole('link', { name: '只阅读准备说明 →' }));
  expect(screen.getByRole('heading', { name: '确认电脑系统' })).toBeTruthy();
  await user.click(screen.getByRole('link', { name: '完整准备资料与来源 →' }));
  expect(screen.getByText(/Relapse 需要已连接的本地网络接口/)).toBeTruthy();
  await user.click(screen.getByRole('link', { name: '继续阅读：安装草稿 →' }));
  const article = screen.getByRole('article');
  expect(
    within(article).getByText(
      'sudo python3 ./webkit-autoloader-host_v0.6.2.py',
      { exact: true },
    ).tagName,
  ).toBe('CODE');
  expect(within(article).queryByRole('button')).toBeNull();
  await user.click(
    screen.getByRole('link', { name: '继续阅读：离线游玩草稿 →' }),
  );
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: '离线游戏：准备与检查（草稿）',
    }),
  ).toBeTruthy();
  expect(screen.getByText(/不要同时叠加/)).toBeTruthy();
  expect(screen.getByText(/正常重启后恢复 \/ 再启动读档：未执行/).tagName).toBe(
    'CODE',
  );
});

it('opens folded case material and sources when followed by a chapter link', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/knowledge/offline-game-workflow']}>
      <App />
    </MemoryRouter>,
  );
  const toggle = screen.getByText('游戏案例：《战神：诸神黄昏》PS5 版', {
    selector: 'summary',
  });
  expect(toggle.parentElement?.hasAttribute('open')).toBe(false);
  await user.click(screen.getByText('本文目录', { selector: 'summary' }));
  const chapter = screen.getByRole('link', {
    name: '游戏案例：《战神：诸神黄昏》PS5 版',
  });
  chapter.focus();
  await user.keyboard('{Enter}');
  expect(toggle.parentElement?.hasAttribute('open')).toBe(true);
  expect(document.activeElement?.id).toBe('ragnarok-first-game');
  await user.click(toggle);
  expect(toggle.parentElement?.hasAttribute('open')).toBe(false);
  await user.click(chapter);
  expect(toggle.parentElement?.hasAttribute('open')).toBe(true);
  expect(
    screen.getByText(/不把 12.40.00.09 转为正式查询的 12.40/),
  ).toBeTruthy();
  await user.click(screen.getByRole('link', { name: '来源与适用范围' }));
  expect(document.activeElement?.id).toBe('article-sources');
  expect(screen.getAllByText('社区报告').length).toBeGreaterThan(0);
});

it('keeps static release review folded but supports direct chapter URLs', () => {
  render(
    <MemoryRouter
      initialEntries={['/knowledge/webkit-first-install#release-review']}
    >
      <App />
    </MemoryRouter>,
  );
  expect(document.activeElement?.id).toBe('release-review');
  expect(document.activeElement?.closest('details')?.open).toBe(true);
  expect(screen.getByText(/11,878,965 字节/)).toBeTruthy();
  expect(screen.getByText(/Windows EXE 和主机 ELF 没有下载校验/)).toBeTruthy();
});

it('recovers from missing article paths', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/knowledge/missing']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: '文章不存在' })).toBeTruthy();
  await user.click(screen.getByRole('link', { name: '返回知识库目录' }));
  expect(screen.getByRole('heading', { name: '中文入门知识库' })).toBeTruthy();
});
