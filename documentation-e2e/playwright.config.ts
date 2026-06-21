import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');
const buildDir = path.join(repoRoot, 'build');
const documentationPath = process.env.DOCUMENTATION_HTML ?? path.join(buildDir, 'output.html');
const documentationPagePath = `/${path.basename(documentationPath, '.html')}`;
const serveRoot = path
  .relative(__dirname, path.dirname(documentationPath))
  .replace(/\\/g, '/');
const port = Number(process.env.DOCUMENTATION_E2E_PORT ?? 8765);

const headed =
  process.env.PLAYWRIGHT_HEADED === '1' ||
  process.env.PLAYWRIGHT_HEADED === 'true';
const slowMoMs = Number(process.env.PLAYWRIGHT_SLOW_MO ?? (headed ? 100 : 0));

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: headed ? 'on-failure' : 'never' }]],
  timeout: 15_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: !headed,
    launchOptions: slowMoMs > 0 ? { slowMo: slowMoMs } : undefined,
    trace: headed ? 'on' : 'on-first-retry',
    video: headed ? 'on' : 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx serve ${serveRoot} -p ${port} --no-clipboard`,
    url: `http://127.0.0.1:${port}${documentationPagePath}`,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
