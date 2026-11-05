import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { emptyDeviceProgress } from '@ps5/core';
import {
  deviceStorageKey,
  preparationStorageKey,
} from './components/device-context';
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
function mount() {
  return render(
    <MemoryRouter initialEntries={['/prepare']}>
      <App />
    </MemoryRouter>,
  );
}
it('requires each report, restores a Windows record and returns to the unconfirmed route with the raw version', async () => {
  localStorage.setItem(
    deviceStorageKey,
    JSON.stringify({
      ...emptyDeviceProgress(),
      step: 3,
      confirmed: true,
      answers: {
        ...emptyDeviceProgress().answers,
        modelCode: 'CFI-TEST01',
        systemVersion: '12.40.00.09',
        homeScreen: 'yes',
        computer: 'yes',
        computerOs: 'windows',
      },
    }),
  );
  const u = userEvent.setup();
  const view = mount();
  await u.click(screen.getByRole('button', { name: '确认本步，继续' }));
  expect(
    screen.getByRole('heading', { name: 'Windows：查看当前连接' }),
  ).toBeTruthy();
  expect(screen.queryByText(/苹果菜单 → 系统设置/)).toBeNull();
  await u.click(screen.getByRole('button', { name: '确认本步，继续' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  await u.click(
    screen.getByLabelText('我已找到并在本地记下电脑当前连接的 IPv4 地址'),
  );
  await u.click(screen.getByRole('button', { name: '确认本步，继续' }));
  expect(
    screen.getByRole('figure', { name: '家庭网络连接计划示意' }),
  ).toBeTruthy();
  await u.click(screen.getByRole('button', { name: '确认本步，继续' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  await u.click(screen.getByLabelText(/我已明确电脑和 PS5/));
  await u.click(screen.getByLabelText(/我已在本地保留主机原网络设置/));
  await u.click(screen.getByRole('button', { name: '确认本步，继续' }));
  await u.click(screen.getByRole('button', { name: '确认准备记录' }));
  expect(
    screen.getByText(
      '准备记录已保存。网络互通、教程适用性与实际安装仍未验证。',
    ),
  ).toBeTruthy();
  const saved = localStorage.getItem(preparationStorageKey);
  expect(saved).not.toContain('192.168');
  view.unmount();
  mount();
  expect(screen.getByRole('heading', { name: '核对准备记录' })).toBe(
    document.activeElement,
  );
  expect(
    within(screen.getByRole('article')).queryByRole('link', { name: /安装/ }),
  ).toBeNull();
  await u.click(screen.getByRole('link', { name: '返回查看当前缺项 →' }));
  expect(
    screen.getByRole('heading', { name: '适用教程尚未确认' }),
  ).toBeTruthy();
  expect(
    (screen.getByLabelText('版本原文（可留空）') as HTMLInputElement).value,
  ).toBe('12.40.00.09');
});
it.each([
  ['macos', 'macOS'],
  ['linux', 'Linux'],
  ['other', '其他系统'],
])(
  'shows only the chosen %s platform and clears reports when switching platforms',
  async (os, label) => {
    const u = userEvent.setup();
    mount();
    await u.selectOptions(screen.getByLabelText('有可用电脑吗？'), 'yes');
    await u.selectOptions(screen.getByLabelText('电脑使用什么系统？'), os);
    await u.click(screen.getByRole('button', { name: '确认本步，继续' }));
    expect(
      screen.getByRole('heading', { name: `${label}：查看当前连接` }),
    ).toBeTruthy();
    if (os !== 'macos')
      expect(screen.getByText(/该系统的具体菜单尚未核验/)).toBeTruthy();
    await u.click(screen.getByLabelText(/我已找到并在本地记下/));
    await u.click(screen.getByRole('button', { name: '上一步' }));
    await u.selectOptions(
      screen.getByLabelText('电脑使用什么系统？'),
      'windows',
    );
    await u.selectOptions(screen.getByLabelText('电脑使用什么系统？'), os);
    await u.click(screen.getByRole('button', { name: '确认本步，继续' }));
    expect(
      (screen.getByLabelText(/我已找到并在本地记下/) as HTMLInputElement)
        .checked,
    ).toBe(false);
  },
);
it('does not advance with unknown or absent computers and stays usable when storage throws', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const u = userEvent.setup();
  mount();
  await u.click(screen.getByRole('button', { name: '确认本步，继续' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  await u.selectOptions(screen.getByLabelText('有可用电脑吗？'), 'no');
  await u.click(screen.getByRole('button', { name: '确认本步，继续' }));
  expect(screen.queryByLabelText(/我已找到并在本地记下/)).toBeNull();
  await u.selectOptions(screen.getByLabelText('有可用电脑吗？'), 'yes');
  await u.click(screen.getByRole('button', { name: '确认本步，继续' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  await u.selectOptions(screen.getByLabelText('电脑使用什么系统？'), 'windows');
  await u.click(screen.getByRole('button', { name: '确认本步，继续' }));
  expect(
    screen.getByRole('heading', { name: '找到电脑的网络地址' }),
  ).toBeTruthy();
  expect(screen.getByText(/此浏览器无法保存进度/)).toBeTruthy();
});
