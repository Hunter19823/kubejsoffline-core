import { test as base, expect, type Page } from '@playwright/test';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..', '..');
const defaultDocumentationHtml = path.join(repoRoot, 'build', 'output.html');

export const documentationHtmlPath =
  process.env.DOCUMENTATION_HTML ?? defaultDocumentationHtml;

/** `serve` exposes HTML at extensionless paths (e.g. `/output`, not `/output.html`). */
export const documentationPageUrl = `/${path.basename(documentationHtmlPath, '.html')}`;

/** One-time worker setup: initial page load through indexing / IndexedDB hydration. */
export const INITIAL_DOCUMENTATION_READY_TIMEOUT_MS = 15_000;

/** Expect timeouts for navigation and assertions after the home page is ready. */
export const POST_HOME_EXPECT_TIMEOUT_MS = 5_000;

/** Table title `h3` ids (pagination also wraps titles in an `h2`, so avoid role-only queries). */
export function globalBindingsHeader(page: Page) {
  return page.locator('#global-bindings-header');
}

export function matchingClassesHeader(page: Page) {
  return page.locator('#class-table-header');
}

/** Event group table title `h3` (table id is the event interface FQN). */
export function eventTableHeader(page: Page, eventInterfaceFqn: string) {
  return page.locator(`[id="${eventInterfaceFqn}-header"]`);
}

export async function goHomeViaPageHeader(page: Page): Promise<void> {
  await page.locator('#page-header h1').click();
  await expect(globalBindingsHeader(page)).toBeVisible({
    timeout: POST_HOME_EXPECT_TIMEOUT_MS,
  });
}

/** Waits until indexing, IndexedDB hydration, and the home page are ready. */
export async function openDocumentationHome(page: Page): Promise<void> {
  await page.goto(documentationPageUrl, { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#page-header')).toBeVisible({
    timeout: INITIAL_DOCUMENTATION_READY_TIMEOUT_MS,
  });

  await expect(globalBindingsHeader(page)).toBeVisible({
    timeout: INITIAL_DOCUMENTATION_READY_TIMEOUT_MS,
  });

  const toast = page.locator('#toast');
  if (await toast.count()) {
    await expect(toast).toBeHidden({ timeout: INITIAL_DOCUMENTATION_READY_TIMEOUT_MS });
  }

  await expect(page.locator('#global-bindings-GlobalString')).toBeVisible({
    timeout: INITIAL_DOCUMENTATION_READY_TIMEOUT_MS,
  });
}

export async function searchDocumentation(
  page: Page,
  query: string,
  searchType = 'class',
): Promise<void> {
  const searchInput = page.getByPlaceholder('Search...');
  const searchTypeSelect = page.locator('select').first();

  await searchTypeSelect.selectOption(searchType);
  await searchInput.fill(query);
  await searchInput.press('Enter');
}

type DocumentationFixtures = {
  documentationPage: Page;
};

export const test = base.extend<object, DocumentationFixtures>({
  documentationPage: [
    async ({ browser }, use) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await openDocumentationHome(page);
      await use(page);
      await context.close();
    },
    { scope: 'worker', timeout: INITIAL_DOCUMENTATION_READY_TIMEOUT_MS },
  ],
});

export { expect };
