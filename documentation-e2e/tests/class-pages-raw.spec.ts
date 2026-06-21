import { test, expect } from '../lib/documentation-fixture';
import {
  classPageHeading,
  openClassPage,
  openClassViaBindingLink,
  returnHomeFromClassPage,
  tableSectionHeader,
  testClass,
} from '../lib/class-page';

test.describe('raw and minimal class pages', () => {
  test('AClass binding opens an empty raw class page', async ({ documentationPage: page }) => {
    await openClassViaBindingLink(page, 'global', 'AClass');

    await expect(classPageHeading(page)).toContainText('AClass');
    await expect(tableSectionHeader(page, 'fields')).toHaveCount(0);
    await expect(tableSectionHeader(page, 'constructors')).toBeVisible();
  });

  test('AClass opens from hash navigation', async ({ documentationPage: page }) => {
    await openClassPage(page, testClass('AClass'));

    await expect(classPageHeading(page)).toContainText(
      'pie.ilikepiefoo.kubejsoffline.testclasses.AClass',
    );
  });

  test('AnonymousClassExample shows fields for comparators and inner generic class', async ({
    documentationPage: page,
  }) => {
    await openClassPage(page, testClass('AnonymousClassExample'));

    await expect(classPageHeading(page)).toContainText('AnonymousClassExample');
    await expect(tableSectionHeader(page, 'fields')).toBeVisible();
    await expect(page.getByText('listOfStrings').first()).toBeVisible();
    await expect(page.getByText('innerGenericClass').first()).toBeVisible();
  });

  test('page header returns to bindings from a raw class page', async ({
    documentationPage: page,
  }) => {
    await openClassPage(page, testClass('AClass'));
    await returnHomeFromClassPage(page);

    await expect(page.locator('#global-bindings-header')).toBeVisible();
  });
});
