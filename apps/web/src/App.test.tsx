import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
afterEach(cleanup);
it('shows sample warning and focal model on the homepage', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByText('CFI-2200B01')).toBeTruthy();
  expect(screen.getByText(/M0 预览 · 当前仅含示例数据/)).toBeTruthy();
});
it('queries a sample, clears stale results, and handles missing records and invalid input', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/compatibility']}>
      <App />
    </MemoryRouter>,
  );
  const input = screen.getByLabelText('系统固件版本');
  const submit = screen.getByRole('button', { name: /查询兼容性/ });
  await user.type(input, '03.00');
  await user.click(submit);
  expect(screen.getByText('兼容性未知')).toBeTruthy();
  expect(screen.getByText(/查看示例来源结构/)).toBeTruthy();
  await user.clear(input);
  expect(screen.queryByText('兼容性未知')).toBeNull();
  await user.type(input, '04.00');
  await user.click(submit);
  expect(screen.getByText(/没有此型号与固件的可靠兼容性记录/)).toBeTruthy();
  await user.selectOptions(screen.getByLabelText('主机型号'), 'demo-console');
  expect(screen.queryByText('兼容性未知')).toBeNull();
  await user.clear(input);
  await user.type(input, 'bad');
  await user.click(submit);
  expect(screen.getByRole('alert').textContent).toContain('请输入有效格式');
});
it('offers a local Host guide and a recoverable 404', () => {
  const view = render(
    <MemoryRouter initialEntries={['/host']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByText('pnpm dev:host')).toBeTruthy();
  view.unmount();
  render(
    <MemoryRouter initialEntries={['/missing']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByText('页面不存在')).toBeTruthy();
});
