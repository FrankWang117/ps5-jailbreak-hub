import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
afterEach(() => {
  cleanup();
  localStorage.clear();
});

it('carries a complete version through query, guidance, edits and a refreshed link', async () => {
  const user = userEvent.setup();
  const view = render(
    <MemoryRouter initialEntries={['/compatibility']}>
      <App />
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText('主机型号'), 'CFI-TEST01');
  await user.type(screen.getByLabelText('系统固件版本'), '12.40.00.09');
  await user.click(screen.getByRole('button', { name: '查询兼容性' }));
  expect(screen.getByRole('heading', { name: '版本原文已保留' })).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByText('0 条方案记录')).toBeNull();
  await user.click(screen.getByRole('link', { name: '继续：确认准备条件 →' }));
  expect(
    (screen.getByLabelText('版本原文（可留空）') as HTMLInputElement).value,
  ).toBe('12.40.00.09');
  expect(
    (screen.getByLabelText('主机型号（可留空）') as HTMLInputElement).value,
  ).toBe('CFI-TEST01');
  await user.selectOptions(
    screen.getByLabelText('能进入主机主界面吗？'),
    'yes',
  );
  await user.selectOptions(screen.getByLabelText('有可用电脑吗？'), 'yes');
  await user.selectOptions(
    screen.getByLabelText('电脑使用什么系统？'),
    'windows',
  );
  await user.click(screen.getByRole('button', { name: '查看我的下一步' }));
  const result = screen.getByRole('region', { name: '我的下一步' });
  expect(
    within(result).getByRole('heading', { name: '适用教程尚未确认' }),
  ).toBeTruthy();
  expect(result).toBe(document.activeElement);
  expect(
    within(result).getByText('版本原文：12.40.00.09（未换算）'),
  ).toBeTruthy();
  expect(within(result).queryByRole('link', { name: /安装/ })).toBeNull();
  await user.clear(screen.getByLabelText('版本原文（可留空）'));
  expect(screen.queryByRole('region', { name: '我的下一步' })).toBeNull();
  await user.type(screen.getByLabelText('版本原文（可留空）'), '09.00');
  await user.click(screen.getByRole('button', { name: '查看我的下一步' }));
  expect(
    screen.getByRole('heading', { name: '可以先了解浏览器准备' }),
  ).toBeTruthy();
  expect(screen.getByText('电脑系统：Windows')).toBeTruthy();
  view.unmount();
  render(
    <MemoryRouter
      initialEntries={[
        '/knowledge/choosing-a-route?model=CFI-TEST01&version=12.40.00.09&homeScreen=yes&computer=yes&computerOs=windows&review=1',
      ]}
    >
      <App />
    </MemoryRouter>,
  );
  expect(
    (screen.getByLabelText('版本原文（可留空）') as HTMLInputElement).value,
  ).toBe('12.40.00.09');
  expect(
    screen.getByRole('heading', { name: '适用教程尚未确认' }),
  ).toBeTruthy();
});

it('keeps unknown answers actionable and clears irrelevant OS selection', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/knowledge/choosing-a-route']}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.queryByRole('link', { name: '继续阅读：浏览器准备 →' }),
  ).toBeNull();
  await user.click(screen.getByRole('button', { name: '查看我的下一步' }));
  expect(screen.getByRole('heading', { name: '先确认设备信息' })).toBeTruthy();
  await user.type(screen.getByLabelText('主机型号（可留空）'), 'CFI-TEST01');
  await user.type(screen.getByLabelText('版本原文（可留空）'), '09.00');
  await user.selectOptions(
    screen.getByLabelText('能进入主机主界面吗？'),
    'yes',
  );
  await user.selectOptions(screen.getByLabelText('有可用电脑吗？'), 'no');
  await user.click(screen.getByRole('button', { name: '查看我的下一步' }));
  expect(
    screen.getByRole('heading', { name: '先确认电脑准备条件' }),
  ).toBeTruthy();
  expect(screen.queryByLabelText('电脑使用什么系统？')).toBeNull();
  await user.selectOptions(screen.getByLabelText('有可用电脑吗？'), 'yes');
  await user.click(screen.getByRole('button', { name: '查看我的下一步' }));
  expect(screen.getByRole('heading', { name: '先确认电脑系统' })).toBeTruthy();
  await user.selectOptions(
    screen.getByLabelText('电脑使用什么系统？'),
    'macos',
  );
  await user.selectOptions(screen.getByLabelText('有可用电脑吗？'), 'no');
  await user.selectOptions(screen.getByLabelText('有可用电脑吗？'), 'yes');
  expect(
    (screen.getByLabelText('电脑使用什么系统？') as HTMLSelectElement).value,
  ).toBe('unknown');
});

it('restores a complete raw version in the query and still rejects malformed input', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter
      initialEntries={[
        '/compatibility?model=CFI-TEST01&version=24.01-08.60.00',
      ]}
    >
      <App />
    </MemoryRouter>,
  );
  const version = screen.getByLabelText('系统固件版本');
  expect((version as HTMLInputElement).value).toBe('24.01-08.60.00');
  await user.click(screen.getByRole('button', { name: '查询兼容性' }));
  expect(screen.getByRole('heading', { name: '版本原文已保留' })).toBeTruthy();
  await user.clear(version);
  await user.type(version, 'not-a-version');
  await user.click(screen.getByRole('button', { name: '查询兼容性' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.queryByRole('heading', { name: '版本原文已保留' })).toBeNull();
});
