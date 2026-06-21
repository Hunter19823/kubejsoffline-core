import { test, expect } from '../lib/documentation-fixture';
import { searchDocumentation } from '../lib/documentation-page';
import {
  classPageHeading,
  ensureDocumentationHome,
  openClassPage,
  openClassViaBindingLink,
  tableSectionHeader,
  testClass,
} from '../lib/class-page';

test.describe('generic and parameterized class pages', () => {
  test('BaseGenericType shows generic signature and boolean field', async ({
    documentationPage: page,
  }) => {
    await openClassPage(page, testClass('BaseGenericType'));

    await expect(classPageHeading(page)).toContainText('BaseGenericType');
    await expect(page.locator('#fields [href*="Boolean"]').first()).toBeVisible();
    await expect(tableSectionHeader(page, 'fields')).toBeVisible();
    await expect(page.getByText('booleanField').first()).toBeVisible();
  });

  test('BaseGenericType inner ParameterizedType class is reachable', async ({
    documentationPage: page,
  }) => {
    await openClassPage(page, `${testClass('BaseGenericType')}$ParameterizedType`);

    await expect(classPageHeading(page)).toContainText('ParameterizedType');
    await expect(tableSectionHeader(page, 'type-variable-mappings')).toBeVisible();
    await expect(page.getByText('byteField').first()).toBeVisible();
  });

  test('GlobalTestData binding opens TestData with parameterized field types', async ({
    documentationPage: page,
  }) => {
    await openClassViaBindingLink(page, 'global', 'GlobalTestData');

    await expect(classPageHeading(page)).toContainText('TestData');
    await expect(page.getByText(/EnclosingClassExample<java\.lang\.String>/).first()).toBeVisible();
  });

  test('clicking a parameterized field type opens EnclosingClassExample', async ({
    documentationPage: page,
  }) => {
    await openClassPage(page, testClass('TestData'));

    await page.locator('#constructors .link').filter({ hasText: 'EnclosingClassExample' }).first().click();

    await expect(classPageHeading(page)).toContainText('EnclosingClassExample');
    await expect(tableSectionHeader(page, 'type-variable-mappings')).toBeVisible();
  });

  test('search finds parameterized EnclosingClassExample variant', async ({
    documentationPage: page,
  }) => {
    await ensureDocumentationHome(page);
    await searchDocumentation(page, 'EnclosingClassExample', 'class-any');

    await expect(
      page.locator('.link').filter({ hasText: 'EnclosingClassExample' }).first(),
    ).toBeVisible();
  });

  test('nested parameterized inner class opens from TestData field link', async ({
    documentationPage: page,
  }) => {
    await openClassPage(page, testClass('TestData'));

    await page
      .locator('#methods tr')
      .filter({ hasText: 'innerClassExample()' })
      .locator('[href*="InnerClassExample"]')
      .first()
      .click();

    await expect(classPageHeading(page)).toContainText('InnerClassExample');
    await expect(tableSectionHeader(page, 'fields')).toBeVisible();
    await expect(page.getByText('innerClassVariableDefinedInInnerClass').first()).toBeVisible();
  });

  test('type variable page opens from generic inner class mapping table', async ({
    documentationPage: page,
  }) => {
    await openClassPage(page, `${testClass('BaseGenericType')}$ParameterizedType`);

    await page.locator('#type-variable-mappings-header').scrollIntoViewIfNeeded();
    await page
      .locator('#fields tr')
      .filter({ hasText: 'byteField' })
      .locator('[href*="Byte"]')
      .first()
      .click();

    await expect(page.getByRole('heading', { level: 1, name: /Type Variable/ })).toBeVisible();
    await expect(page.getByText('This is a type variable')).toBeVisible();
  });
});
