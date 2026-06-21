import {
  test,
  expect,
  eventTableHeader,
  goHomeViaPageHeader,
  globalBindingsHeader,
} from '../lib/documentation-fixture';
import { bindingRow } from '../lib/class-page';

test.describe('documentation home page', () => {
  test('loads bindings and event tables after indexing', async ({ documentationPage: page }) => {
    await expect(bindingRow(page, 'global', 'GlobalString')).toBeVisible();
    await expect(bindingRow(page, 'global', 'GlobalString')).toContainText('Hello World');
  });

  test('shows global, client, server, and startup binding tables', async ({
    documentationPage: page,
  }) => {
    await expect(globalBindingsHeader(page)).toBeVisible();
    await expect(page.locator('#client-bindings-header')).toBeVisible();
    await expect(page.locator('#server-bindings-header')).toBeVisible();
    await expect(page.locator('#startup-bindings-header')).toBeVisible();
  });

  test('lists primitive and collection binding values on the home page', async ({
    documentationPage: page,
  }) => {
    await expect(bindingRow(page, 'global', 'GlobalInt')).toBeVisible();
    await expect(bindingRow(page, 'global', 'GlobalBoolean')).toBeVisible();
    await expect(bindingRow(page, 'global', 'GlobalMap')).toBeVisible();
    await expect(bindingRow(page, 'global', 'GlobalListOfStrings')).toBeVisible();
    await expect(bindingRow(page, 'global', 'GlobalArrayOfStrings')).toBeVisible();
    await expect(bindingRow(page, 'global', 'Global2DArrayOfStrings')).toBeVisible();
    await expect(bindingRow(page, 'global', 'Global3DArrayOfStrings')).toBeVisible();
  });

  test('shows event group tables for sample event interfaces', async ({
    documentationPage: page,
  }) => {
    await expect(
      eventTableHeader(page, 'pie.ilikepiefoo.kubejsoffline.testclasses.BlockEventExample'),
    ).toBeVisible();
    await expect(
      eventTableHeader(page, 'pie.ilikepiefoo.kubejsoffline.testclasses.EventExample'),
    ).toBeVisible();
  });

  test('search bar is available on the home page', async ({ documentationPage: page }) => {
    await expect(page.getByPlaceholder('Search...')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('header navigates back home from a class page', async ({ documentationPage: page }) => {
    await page.locator('#global-bindings-Z-AClass .link').click();

    await expect(page.locator('body > h3:not([id])')).toContainText('AClass');

    await goHomeViaPageHeader(page);
  });
});
