import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it('keeps query, help and return navigation inside the mounted subdirectory', async () => {
  const u = userEvent.setup();
  render(
    <MemoryRouter basename="/ps5" initialEntries={['/ps5/']}>
      <App />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('link', { name: /开始确认我的设备/ }).getAttribute('href'),
  ).toBe('/ps5/start');
  await u.click(screen.getByRole('radio', { name: '已知系统版本' }));
  await u.type(screen.getByLabelText('完整主机型号'), 'CFI-2200B01');
  await u.type(screen.getByLabelText('实际系统版本原文'), '12.40');
  await u.click(screen.getByRole('button', { name: '确认查询' }));
  expect(
    screen
      .getByRole('link', { name: '查看完整查询与来源 →' })
      .getAttribute('href'),
  ).toContain('/ps5/compatibility?model=CFI-2200B01');
  await u.click(screen.getByRole('link', { name: '问题反馈 / 资料纠错' }));
  expect(
    screen.getByRole('heading', { name: '问题反馈与资料纠错' }),
  ).toBeTruthy();
  expect(
    screen.getByRole('link', { name: '返回首页' }).getAttribute('href'),
  ).toBe('/ps5');
});
