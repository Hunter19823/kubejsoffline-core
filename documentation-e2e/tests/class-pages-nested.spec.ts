import { test, expect } from '../lib/documentation-fixture';
import {
  classPageHeading,
  nestedTestClass,
  openClassPage,
  tableSectionHeader,
  testClass,
} from '../lib/class-page';

test.describe('nested class pages', () => {
  test('RootClass exposes top-level field', async ({ documentationPage: page }) => {
    await openClassPage(page, testClass('RootClass'));

    await expect(classPageHeading(page)).toContainText('RootClass');
    await expect(tableSectionHeader(page, 'fields')).toBeVisible();
    await expect(page.getByText('rootField').first()).toBeVisible();
  });

  test('deeply nested static inner class shows its own field', async ({
    documentationPage: page,
  }) => {
    await openClassPage(
      page,
      nestedTestClass('RootClass', 'FirstInnerClass', 'SecondInnerClass', 'ThirdInnerClass'),
    );

    await expect(classPageHeading(page)).toContainText('ThirdInnerClass');
    await expect(page.getByText('thirdInnerField').first()).toBeVisible();
  });

  test('EnclosingClassExample lists inner class relationships', async ({
    documentationPage: page,
  }) => {
    await openClassPage(page, testClass('EnclosingClassExample'));

    await expect(classPageHeading(page)).toContainText('EnclosingClassExample');
    await expect(tableSectionHeader(page, 'related-classes')).toBeVisible();
    await expect(page.getByText('InnerClassExample').first()).toBeVisible();
    await expect(page.getByText('InnerClassWithMultipleTypeVariablesExample').first()).toBeVisible();
  });

  test('inner generic class InnerGenericClass shows compare method', async ({
    documentationPage: page,
  }) => {
    await openClassPage(page, `${testClass('AnonymousClassExample')}$InnerGenericClass`);

    await expect(classPageHeading(page)).toContainText('InnerGenericClass');
    await expect(tableSectionHeader(page, 'methods')).toBeVisible();
    await expect(page.getByText('compare').first()).toBeVisible();
  });
});
