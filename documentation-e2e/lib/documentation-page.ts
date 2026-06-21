import { expect } from '@playwright/test';
import path from 'node:path';
import {
  matchingClassesHeader,
  POST_HOME_EXPECT_TIMEOUT_MS,
} from './documentation-fixture';

const repoRoot = path.resolve(__dirname, '..', '..');
const buildDir = path.join(repoRoot, 'build');
const defaultDocumentationHtml = path.join(buildDir, 'output.html');

export const documentationHtmlPath =
  process.env.DOCUMENTATION_HTML ?? defaultDocumentationHtml;

/** `serve` exposes HTML at extensionless paths (e.g. `/output`, not `/output.html`). */
export const documentationPageUrl = `/${path.basename(documentationHtmlPath, '.html')}`;

export async function searchDocumentation(
  page: import('@playwright/test').Page,
  query: string,
  searchType = 'class',
): Promise<void> {
  const searchInput = page.getByPlaceholder('Search...');
  const searchTypeSelect = page.locator('select').first();

  await searchTypeSelect.selectOption(searchType);
  await searchInput.fill(query);
  await searchInput.press('Enter');

  await expect(page.getByText('Please wait while we process your query')).toBeHidden({
    timeout: POST_HOME_EXPECT_TIMEOUT_MS,
  });
  await expect(matchingClassesHeader(page)).toBeVisible({
    timeout: POST_HOME_EXPECT_TIMEOUT_MS,
  });
}
