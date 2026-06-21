import { test, expect } from '../lib/documentation-fixture';
import {
  bindingRow,
  classPageHeading,
  ensureDocumentationHome,
  openClassViaBindingLink,
  tableSectionHeader,
} from '../lib/class-page';

test.describe('class pages opened from binding types', () => {
  test('GlobalClass binding opens TypeManager documentation', async ({
    documentationPage: page,
  }) => {
    await openClassViaBindingLink(page, 'global', 'GlobalClass');

    await expect(classPageHeading(page)).toContainText('TypeManager');
    await expect(tableSectionHeader(page, 'methods')).toBeVisible();
  });

  test('GlobalEnumClass binding opens enum type page', async ({ documentationPage: page }) => {
    await openClassViaBindingLink(page, 'global', 'GlobalEnumClass');

    await expect(classPageHeading(page)).toContainText('MultipleGradientPaint');
  });

  test('GlobalArrayOfStrings binding shows array type in the type column', async ({
    documentationPage: page,
  }) => {
    await ensureDocumentationHome(page);

    await expect(bindingValuesCell(page, 'global', 'GlobalArrayOfStrings')).toContainText('Hello World');
  });

  test('Global2DArrayOfStrings binding shows two-dimensional array type', async ({
    documentationPage: page,
  }) => {
    await ensureDocumentationHome(page);

    await expect(bindingValuesCell(page, 'global', 'Global2DArrayOfStrings')).toContainText('Hello World');
  });
});

function bindingTypeCell(
  page: import('@playwright/test').Page,
  scope: string,
  bindingName: string,
) {
  return bindingRow(page, scope, bindingName).locator('td').nth(2);
}

function bindingValuesCell(
  page: import('@playwright/test').Page,
  scope: string,
  bindingName: string,
) {
  return bindingRow(page, scope, bindingName).locator('td').nth(3);
}