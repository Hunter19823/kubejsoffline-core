import { test, expect } from '../lib/documentation-fixture';
import { ensureDocumentationHome } from '../lib/class-page';
import { searchDocumentation } from '../lib/documentation-page';

test.describe('documentation search', () => {
  test('class search shows matching types', async ({ documentationPage: page }) => {
    await ensureDocumentationHome(page);
    await searchDocumentation(page, 'AClass', 'any');

    await expect(page.locator('.link').filter({ hasText: 'AClass' }).first()).toBeVisible();
  });
});
