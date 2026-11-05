import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
afterEach(() => {
  cleanup();
  localStorage.clear();
});
function mount() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
}
it('shows a fast prefix result without persisting it or turning the estimate into an actual version', async () => {
  const u = userEvent.setup();
  mount();
  await u.type(screen.getByLabelText('S01- 后的 4 位'), 'f561');
  await u.keyboard('{Enter}');
  const result = screen.getByRole('region', { name: '快速查询结果' });
  expect(result).toBe(document.activeElement);
  expect(
    within(result).getByRole('heading', { name: '找到出厂版本线索' }),
  ).toBeTruthy();
  expect(within(result).getByText('12.40 / 12.60')).toBeTruthy();
  expect(within(result).getByText('能否破解：仍需确认')).toBeTruthy();
  expect(JSON.stringify(localStorage)).not.toContain('F561');
  expect(within(result).queryByRole('link', { name: /安装|执行/ })).toBeNull();
  await u.click(screen.getByRole('button', { name: '已开机？填写实际版本' }));
  expect(
    (screen.getByLabelText('实际系统版本原文') as HTMLInputElement).value,
  ).toBe('');
  expect(
    (screen.getByLabelText('完整主机型号') as HTMLInputElement).value,
  ).toBe('');
  expect(document.activeElement).toBe(screen.getByLabelText('完整主机型号'));
  expect(screen.queryByRole('region', { name: '快速查询结果' })).toBeNull();
});
it('extracts pasted serials, clears old results and keeps unknown prefixes unknown', async () => {
  const u = userEvent.setup();
  mount();
  const input = screen.getByLabelText('S01- 后的 4 位');
  await u.click(input);
  await u.paste('CFI-2200B01');
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(document.activeElement).toBe(input);
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(input.getAttribute('aria-describedby')).toContain('quick-error');
  await u.paste('s01–f561123456');
  expect((input as HTMLInputElement).value).toBe('F561');
  expect(screen.getByRole('status').textContent).toContain(
    '已提取前缀 S01-F561',
  );
  expect(input.getAttribute('aria-invalid')).toBe('false');
  expect(JSON.stringify(localStorage)).not.toContain('123456');
  await u.click(screen.getByRole('button', { name: '确认查询' }));
  await u.clear(input);
  expect(screen.queryByRole('region', { name: '快速查询结果' })).toBeNull();
  await u.type(input, 'X561');
  await u.click(screen.getByRole('button', { name: '确认查询' }));
  expect(
    screen.getByRole('heading', { name: '尚无匹配的出厂记录' }),
  ).toBeTruthy();
  expect(screen.queryByText('12.40 / 12.60')).toBeNull();
});
it('explains lookup limits and information location before querying, and focuses invalid versions', async () => {
  const u = userEvent.setup();
  mount();
  expect(screen.getByText(/破解兼容性资料待补充/)).toBeTruthy();
  const help = screen.getByText('信息在哪里？');
  await u.click(help);
  expect(help.closest('details')?.open).toBe(true);
  expect(screen.getByText(/查看包装盒底部的序列号标签/)).toBeTruthy();
  expect(
    screen.getByRole('link', { name: '查看型号和系统版本的位置 →' }),
  ).toBeTruthy();
  await u.click(screen.getByRole('radio', { name: '已知系统版本' }));
  await u.type(screen.getByLabelText('完整主机型号'), 'CFI-2200B01');
  await u.click(screen.getByRole('button', { name: '确认查询' }));
  const version = screen.getByLabelText('实际系统版本原文');
  expect(document.activeElement).toBe(version);
  expect(version.getAttribute('aria-invalid')).toBe('true');
  expect(version.getAttribute('aria-describedby')).toContain('quick-error');
  await u.type(version, '12.40');
  expect(version.getAttribute('aria-invalid')).toBe('false');
  expect(screen.queryByRole('alert')).toBeNull();
});
it('keeps four editable characters and supports deletion and paste over a selection', async () => {
  const u = userEvent.setup();
  mount();
  const input = screen.getByLabelText('S01- 后的 4 位') as HTMLInputElement;
  await u.type(input, 'f568999');
  expect(input.value).toBe('F568');
  await u.keyboard('{Backspace}');
  expect(input.value).toBe('F56');
  await u.paste('1');
  expect(input.value).toBe('F561');
  await u.keyboard('{Control>}a{/Control}');
  await u.paste('x561');
  expect(input.value).toBe('X561');
  await u.paste('S01-F568334');
  expect(input.value).toBe('F568');
  expect(document.body.textContent).not.toContain('F568334');
  await u.click(screen.getByRole('radio', { name: '按型号' }));
  expect(screen.queryByText(/已提取前缀/)).toBeNull();
});
it('provides series records by model, retains unsupported models, and supports keyboard mode selection', async () => {
  const u = userEvent.setup();
  mount();
  screen.getByRole('radio', { name: '按序列号' }).focus();
  await u.keyboard('{ArrowRight}');
  expect(
    (screen.getByRole('radio', { name: '按型号' }) as HTMLInputElement).checked,
  ).toBe(true);
  const input = screen.getByLabelText('完整主机型号');
  await u.type(input, 'CFI-2116A');
  await u.click(screen.getByRole('button', { name: '确认查询' }));
  await u.click(screen.getByText(/^查看已收录批次/));
  expect(screen.getByRole('table', { name: '已收录批次参考' })).toBeTruthy();
  await u.clear(input);
  await u.type(input, 'CFI-2200B01');
  await u.click(screen.getByRole('button', { name: '确认查询' }));
  expect(
    screen.getByRole('heading', { name: '尚无匹配的出厂记录' }),
  ).toBeTruthy();
  expect(screen.queryByRole('table')).toBeNull();
});
it('queries known firmware separately and never maps a long version or fills it from estimates', async () => {
  const u = userEvent.setup();
  mount();
  await u.click(screen.getByRole('radio', { name: '已知系统版本' }));
  await u.type(screen.getByLabelText('完整主机型号'), 'CFI-2200B01');
  const version = screen.getByLabelText('实际系统版本原文');
  await u.type(version, '12.40');
  await u.click(screen.getByRole('button', { name: '确认查询' }));
  expect(screen.getByText('0 条方案记录')).toBeTruthy();
  await u.clear(version);
  await u.type(version, '12.40.00.09');
  await u.click(screen.getByRole('button', { name: '确认查询' }));
  expect(screen.getByRole('heading', { name: '版本原文已保留' })).toBeTruthy();
  expect(screen.queryByText('0 条方案记录')).toBeNull();
  const link = screen.getByRole('link', { name: '查看完整查询与来源 →' });
  expect(link.getAttribute('href')).toContain('version=12.40.00.09');
});
