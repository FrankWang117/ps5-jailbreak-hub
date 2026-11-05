import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { emptyDeviceProgress } from '@ps5/core';
import App from './App';
import {
  deviceStorageKey,
  preparationStorageKey,
} from './components/device-context';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
function mount(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
it('shows beta coverage before lookup and keeps developer links out of the public navigation', () => {
  mount();
  expect(screen.getByText('Beta', { exact: true })).toBeTruthy();
  expect(screen.getByText(/已收录 83 个批次/)).toBeTruthy();
  expect(
    within(screen.getByRole('navigation', { name: '主导航' })).queryByRole(
      'link',
      { name: /Host/ },
    ),
  ).toBeNull();
  expect(screen.queryByRole('link', { name: /查询我的主机/ })).toBeNull();
  expect(screen.getByRole('link', { name: '关于与数据说明' })).toBeTruthy();
});
it('clears only owned progress and immediately updates the device context', async () => {
  const u = userEvent.setup();
  const progress = emptyDeviceProgress();
  progress.answers.modelCode = 'CFI-2200B01';
  localStorage.setItem(deviceStorageKey, JSON.stringify(progress));
  localStorage.setItem(preparationStorageKey, 'test');
  localStorage.setItem('ps5-hub-theme', 'dark');
  localStorage.setItem('unrelated', 'keep');
  mount('/about');
  expect(
    screen.getByRole('complementary', { name: '我的设备记录' }),
  ).toBeTruthy();
  await u.click(screen.getByRole('button', { name: '清空设备与准备记录' }));
  expect(localStorage.getItem(deviceStorageKey)).toBeNull();
  expect(localStorage.getItem(preparationStorageKey)).toBeNull();
  expect(localStorage.getItem('unrelated')).toBe('keep');
  expect(localStorage.getItem('ps5-hub-theme')).toBe('dark');
  expect(
    screen.queryByRole('complementary', { name: '我的设备记录' }),
  ).toBeNull();
  expect(screen.getByRole('status').textContent).toContain('已清空');
});
it('reports failed deletion without claiming persistent records were removed', async () => {
  const u = userEvent.setup();
  mount('/about');
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('unavailable');
  });
  await u.click(screen.getByRole('button', { name: '清空设备与准备记录' }));
  expect(screen.getByRole('status').textContent).toContain(
    '无法确认持久化记录已删除',
  );
});
it('offers a public feedback link and a copy fallback without including device data', async () => {
  const u = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('denied'),
  );
  mount('/feedback');
  expect(
    screen
      .getByRole('link', { name: /去 GitHub 提交反馈/ })
      .getAttribute('href'),
  ).toBe('https://github.com/FrankWang117/ps5-jailbreak-hub/issues/new');
  expect(screen.getByText('反馈会公开显示')).toBeTruthy();
  await u.click(screen.getByRole('button', { name: '复制反馈模板' }));
  expect(screen.getByRole('status').textContent).toContain('手动复制');
  expect(
    (screen.getByLabelText('反馈模板（可自行选择复制）') as HTMLTextAreaElement)
      .value,
  ).not.toContain('CFI-2200B01');
});
it('sets article metadata, excludes demo and personal query URLs, and restores indexable metadata on navigation', async () => {
  const u = userEvent.setup();
  mount('/demo/compatibility');
  expect(
    document.querySelector('meta[name="robots"]')?.getAttribute('content'),
  ).toBe('noindex, follow');
  await u.click(screen.getByRole('link', { name: '首页' }));
  expect(document.title).toBe('PS5 出厂版本参考 · Beta');
  expect(
    document.querySelector('meta[name="robots"]')?.getAttribute('content'),
  ).toBe('index, follow');
  expect(
    document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
  ).not.toContain('?');
  cleanup();
  mount('/knowledge/first-boot');
  expect(document.title).toContain('第一次开机');
  expect(
    document.querySelector('meta[property="og:type"]')?.getAttribute('content'),
  ).toBe('article');
  cleanup();
  mount('/compatibility?model=CFI-2200B01&version=12.40');
  expect(
    document.querySelector('meta[name="robots"]')?.getAttribute('content'),
  ).toBe('noindex, follow');
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect(
    document.querySelector('meta[property="og:url"]')?.getAttribute('content'),
  ).not.toContain('CFI-2200B01');
});
