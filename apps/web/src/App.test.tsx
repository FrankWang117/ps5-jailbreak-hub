import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { dataset } from '@ps5/data';
import {
  datasetSchema,
  statusLabels,
  type CompatibilityStatus,
} from '@ps5/core';
import App from './App';
import { CompatibilityPage } from './CompatibilityPage';
import { DeviceProvider } from './components/device-context';
import { CompatibilityResults } from './components/compatibility-results';
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it('shows sourced model facts, separate unknown compatibility, and links to original product pages', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  await user.click(screen.getByText('型号示例：CFI-2200B01'));
  expect(screen.getByRole('heading', { name: 'CFI-2200B01' })).toBeTruthy();
  await user.click(screen.getByText('型号资料与字段来源 · 已有一手来源'));
  expect(screen.getByText('825GB SSD（标称）')).toBeTruthy();
  expect(screen.getByText('2025-11-21')).toBeTruthy();
  expect(
    screen
      .getByRole('link', {
        name: '发售日期来源：Sony Interactive Entertainment / PlayStation 日本',
      })
      .getAttribute('href'),
  ).toContain('playstation.com');
  expect(screen.queryByText('虚构演示主机')).toBeNull();
});
it('formal query never falls back to demo records and preserves unmapped full versions', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/compatibility']}>
      <App />
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText('主机型号'), 'CFI-2200B01');
  const input = screen.getByLabelText('系统固件版本');
  const submit = screen.getByRole('button', { name: /查询兼容性/ });
  await user.type(input, '03.00');
  await user.keyboard('{Enter}');
  expect(screen.getByText('兼容性未知')).toBeTruthy();
  expect(screen.getByText('0 条方案记录')).toBeTruthy();
  expect(screen.queryByText(/示例方案占位/)).toBeNull();
  await user.clear(input);
  expect(screen.queryByText('兼容性未知')).toBeNull();
  await user.type(input, '24.01-08.60.00');
  await user.click(submit);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('heading', { name: '版本原文已保留' })).toBeTruthy();
  expect(screen.getByText('24.01-08.60.00')).toBeTruthy();
  expect(screen.queryByText('0 条方案记录')).toBeNull();
});
it('explicit demo mode shows sample evidence and returning to formal mode clears query state', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/compatibility']}>
      <App />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('link', { name: '体验独立示例查询 →' }));
  await screen.findByText('演示数据模式 · 与正式目录隔离');
  const input = screen.getByLabelText('系统固件版本');
  await user.type(input, '03.00');
  await user.click(screen.getByRole('button', { name: /查询兼容性/ }));
  const article = screen.getByRole('article', {
    name: '示例方案占位兼容性记录',
  });
  expect(within(article).getAllByText('未知').length).toBeGreaterThan(0);
  expect(within(article).getByText(/示例证据（非真实来源）/)).toBeTruthy();
  await user.selectOptions(screen.getByLabelText('主机型号'), 'demo-console');
  expect(screen.queryByRole('article')).toBeNull();
  await user.click(screen.getByRole('button', { name: /查询兼容性/ }));
  expect(screen.getByText('兼容性未知')).toBeTruthy();
  await user.click(screen.getByRole('link', { name: '返回正式查询 →' }));
  expect(screen.getByText('等待你的查询')).toBeTruthy();
  expect(
    (screen.getByLabelText('系统固件版本') as HTMLInputElement).value,
  ).toBe('');
  expect(screen.queryByRole('option', { name: '虚构演示主机' })).toBeNull();
});
function multiMethodFixture() {
  const data = structuredClone(dataset);
  data.firmwares = [{ id: 'test-fw', version: '03.00', isExample: false }];
  (Object.keys(statusLabels) as CompatibilityStatus[]).forEach(
    (status, index) => {
      const id = `fixture-${index}`;
      data.methods.push({
        id,
        name: `测试方案 ${index}`,
        description: '隔离测试夹具，不发布',
        isExample: false,
      });
      data.compatibility.push({
        id,
        modelId: 'cfi-2200b01',
        firmwareId: 'test-fw',
        methodId: id,
        status,
        evidenceIds: [id],
        explanation: `测试状态 ${status}`,
        limitations: status === 'partial' ? ['仅测试功能 A'] : [],
        isExample: false,
      });
      data.evidence.push({
        id,
        title: `测试来源 ${index}`,
        url: 'https://example.org/test-only',
        publisher: '隔离测试',
        kind: 'primary',
        verified: status !== 'unknown',
        checkedAt: '2026-11-02T00:00:00Z',
        summary: '夹具，不是真实证据',
        scope: {
          modelId: 'cfi-2200b01',
          firmwareId: 'test-fw',
          methodId: id,
          status,
        },
      });
    },
  );
  return datasetSchema.parse(data);
}
it('renders all five statuses independently with restrictions, scope and dated evidence', async () => {
  const user = userEvent.setup();
  render(
    <CompatibilityResults
      data={multiMethodFixture()}
      modelId="cfi-2200b01"
      firmware="03.00"
      mode="published"
    />,
  );
  expect(screen.getAllByRole('article')).toHaveLength(5);
  expect(screen.getByText('5 条方案记录')).toBeTruthy();
  for (const [index, status] of (
    Object.keys(statusLabels) as CompatibilityStatus[]
  ).entries()) {
    const article = screen.getByRole('article', {
      name: `测试方案 ${index}兼容性记录`,
    });
    expect(
      within(article).getAllByText(statusLabels[status]).length,
    ).toBeGreaterThan(0);
    expect(within(article).queryByText(/示例记录/)).toBeNull();
    await user.click(
      within(article).getByText(new RegExp(`测试来源 ${index}`)),
    );
    expect(within(article).getByText('2026-11-02')).toBeTruthy();
    expect(
      within(article).getByText(`CFI-2200B01 / 03.00 / 测试方案 ${index}`),
    ).toBeTruthy();
  }
  expect(screen.getByText('仅测试功能 A')).toBeTruthy();
  expect(screen.getByText(/此结论仅限上述证据的核验时间/)).toBeTruthy();
  expect(screen.getByText(/待核验的兼容性来源/)).toBeTruthy();
  expect(screen.queryByText('兼容性未知')).toBeNull();
});
it('clears a non-unknown result when editing query conditions and honors model URL selection', async () => {
  const user = userEvent.setup();
  const data = multiMethodFixture();
  render(
    <MemoryRouter initialEntries={['/compatibility?model=cfi-2200b01']}>
      <DeviceProvider>
        <CompatibilityPage data={data} />
      </DeviceProvider>
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText('系统固件版本'), '03.00');
  await user.click(screen.getByRole('button', { name: /查询兼容性/ }));
  expect(screen.getAllByRole('article')).toHaveLength(5);
  await user.clear(screen.getByLabelText('系统固件版本'));
  expect(screen.queryByRole('article')).toBeNull();
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

it('accepts an unlisted complete model and clears results on model changes', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/compatibility']}>
      <App />
    </MemoryRouter>,
  );
  const model = screen.getByLabelText('主机型号');
  expect((model as HTMLInputElement).value).toBe('');
  await user.type(model, 'CFI-TEST01');
  await user.type(screen.getByLabelText('系统固件版本'), '09.00');
  await user.keyboard('{Enter}');
  expect(screen.getByRole('heading', { name: 'CFI-TEST01' })).toBeTruthy();
  expect(screen.getByText('兼容性未知')).toBeTruthy();
  expect(screen.queryByText('型号资料与字段来源 · 已有一手来源')).toBeNull();
  await user.clear(model);
  expect(screen.queryByText('兼容性未知')).toBeNull();
  await user.type(model, 'CFI-2200B01');
  await user.keyboard('{Enter}');
  expect(screen.getByText('兼容性未知')).toBeTruthy();
  await user.clear(model);
  await user.type(model, 'CFI-2200*');
  await user.keyboard('{Enter}');
  expect(screen.getByRole('alert').textContent).toContain('完整 CFI- 型号编号');
  expect(screen.queryByText('兼容性未知')).toBeNull();
});
