import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { ThemeSwitcher } from './theme-switcher';
import App from '../App';
beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
it('switches with keyboard, persists explicit choice, and restores it after remount', async () => {
  const user = userEvent.setup();
  const view = render(<ThemeSwitcher />);
  expect(
    screen
      .getByRole('button', { name: '浅色主题' })
      .getAttribute('aria-pressed'),
  ).toBe('true');
  await user.tab();
  await user.tab();
  await user.keyboard('{Enter}');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(localStorage.getItem('ps5-hub-theme')).toBe('dark');
  view.unmount();
  delete document.documentElement.dataset.theme;
  render(<ThemeSwitcher />);
  expect(
    screen
      .getByRole('button', { name: '深色主题' })
      .getAttribute('aria-pressed'),
  ).toBe('true');
  await user.click(screen.getByRole('button', { name: '浅色主题' }));
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(localStorage.getItem('ps5-hub-theme')).toBe('light');
});
it('theme selection remains available and keeps its state across routes', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('button', { name: '深色主题' }));
  await user.click(screen.getByRole('link', { name: '兼容性查询' }));
  expect(
    screen.getByRole('heading', { name: /了解你的主机兼容性/ }),
  ).toBeTruthy();
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(
    screen
      .getByRole('button', { name: '深色主题' })
      .getAttribute('aria-pressed'),
  ).toBe('true');
});
it('keeps theme switching usable when browser storage is blocked', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const user = userEvent.setup();
  render(<ThemeSwitcher />);
  await user.click(screen.getByRole('button', { name: '深色主题' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
});
const bootstrap = readFileSync('public/theme-init.js', 'utf8');
it.each([
  ['light', true, 'light'],
  ['dark', false, 'dark'],
  [null, true, 'dark'],
  ['invalid', false, 'light'],
] as const)(
  'pre-paint boot resolves stored %s and system dark=%s to %s',
  (saved, dark, expected) => {
    const root = { dataset: { theme: '' } };
    runInNewContext(bootstrap, {
      document: { documentElement: root },
      localStorage: { getItem: () => saved },
      window: { matchMedia: () => ({ matches: dark }) },
    });
    expect(root.dataset.theme).toBe(expected);
  },
);
it('pre-paint boot tolerates blocked storage and absent matchMedia', () => {
  const root = { dataset: { theme: '' } };
  runInNewContext(bootstrap, {
    document: { documentElement: root },
    localStorage: {
      getItem: () => {
        throw new Error('blocked');
      },
    },
    window: {},
  });
  expect(root.dataset.theme).toBe('light');
});
