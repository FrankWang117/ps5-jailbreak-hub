import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { emptyDeviceProgress } from '@ps5/core';
import App from './App';
import { deviceStorageKey } from './components/device-context';
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
function start(path = '/start') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
it('confirms each prerequisite, restores progress and carries raw device information into the query', async () => {
  const u = userEvent.setup();
  const view = start();
  await u.click(screen.getByRole('button', { name: '确认这一步，继续' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  await u.type(screen.getByLabelText('机身完整型号'), 'CFI-TEST01');
  await u.click(screen.getByRole('button', { name: '确认这一步，继续' }));
  await u.click(screen.getByRole('button', { name: '确认这一步，继续' }));
  expect(screen.getByRole('heading', { name: '先停在这一步' })).toBeTruthy();
  await u.selectOptions(screen.getByLabelText('你现在看到什么？'), 'yes');
  await u.click(screen.getByRole('button', { name: '确认这一步，继续' }));
  await u.type(screen.getByLabelText('系统软件版本原文'), '12.40.00.09');
  view.unmount();
  start();
  expect(
    (screen.getByLabelText('系统软件版本原文') as HTMLInputElement).value,
  ).toBe('12.40.00.09');
  await u.click(screen.getByRole('button', { name: '确认这一步，继续' }));
  expect(screen.queryByRole('link', { name: '带着记录去查询 →' })).toBeNull();
  await u.click(screen.getByRole('button', { name: '信息正确，确认保存' }));
  await u.click(screen.getByRole('link', { name: '带着记录去查询 →' }));
  expect(
    (screen.getByLabelText('系统固件版本') as HTMLInputElement).value,
  ).toBe('12.40.00.09');
  await u.click(screen.getByRole('button', { name: '查询兼容性' }));
  expect(screen.getByRole('heading', { name: '版本原文已保留' })).toBeTruthy();
  expect(
    within(
      screen.getByRole('complementary', { name: '我的设备记录' }),
    ).getByText(/CFI-TEST01/),
  ).toBeTruthy();
});
it('invalidates downstream device answers after changing the model and never advances from a blocked home screen', async () => {
  localStorage.setItem(
    deviceStorageKey,
    JSON.stringify({
      ...emptyDeviceProgress(),
      step: 3,
      confirmed: true,
      answers: {
        ...emptyDeviceProgress().answers,
        modelCode: 'CFI-TEST01',
        systemVersion: '09.00',
        homeScreen: 'yes',
      },
    }),
  );
  const u = userEvent.setup();
  start();
  for (let i = 0; i < 3; i++)
    await u.click(screen.getByRole('button', { name: '上一步' }));
  await u.clear(screen.getByLabelText('机身完整型号'));
  await u.type(screen.getByLabelText('机身完整型号'), 'CFI-TEST02');
  await u.click(screen.getByRole('button', { name: '确认这一步，继续' }));
  expect(
    (screen.getByLabelText('你现在看到什么？') as HTMLSelectElement).value,
  ).toBe('unknown');
  await u.selectOptions(screen.getByLabelText('你现在看到什么？'), 'no');
  await u.click(screen.getByRole('button', { name: '确认这一步，继续' }));
  expect(screen.queryByLabelText('系统软件版本原文')).toBeNull();
  expect(screen.getByText(/正在安装系统更新时保持供电/)).toBeTruthy();
});
it('keeps the flow usable when browser storage cannot be read or written', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('unavailable');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('unavailable');
  });
  const u = userEvent.setup();
  start();
  await u.type(screen.getByLabelText('机身完整型号'), 'CFI-TEST01');
  expect(screen.getByText(/此浏览器无法保存/)).toBeTruthy();
  await u.click(screen.getByRole('button', { name: '确认这一步，继续' }));
  expect(screen.getByLabelText('你现在看到什么？')).toBeTruthy();
});
