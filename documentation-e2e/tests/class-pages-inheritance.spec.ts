import { test, expect } from '../lib/documentation-fixture';
import {
  classPageHeading,
  openClassPage,
  tableSectionHeader,
  testClass,
} from '../lib/class-page';

test.describe('subclass and generic hierarchy class pages', () => {
  test('ThirdClass shows inherited generic methods', async ({ documentationPage: page }) => {
    await openClassPage(page, testClass('ThirdClass'));

    await expect(classPageHeading(page)).toContainText('ThirdClass');
    await expect(tableSectionHeader(page, 'methods')).toBeVisible();
    await expect(page.getByText('getSelf').first()).toBeVisible();
    await expect(page.getByText('getGenericType').first()).toBeVisible();
  });

  test('FirstClass abstract type exposes generic accessors', async ({ documentationPage: page }) => {
    await openClassPage(page, testClass('FirstClass'));

    await expect(classPageHeading(page)).toContainText('FirstClass');
    await expect(tableSectionHeader(page, 'methods')).toBeVisible();
    await expect(page.getByText('setSelf').first()).toBeVisible();
    await expect(page.getByText('setGenericType').first()).toBeVisible();
  });

  test('SecondClass shows type variable mapping for its hierarchy', async ({
    documentationPage: page,
  }) => {
    await openClassPage(page, testClass('SecondClass'));

    await expect(classPageHeading(page)).toContainText('SecondClass');
    await expect(tableSectionHeader(page, 'type-variable-mappings')).toBeVisible();
    await expect(tableSectionHeader(page, 'related-classes')).toBeVisible();
  });

  test('TestData record lists component fields', async ({ documentationPage: page }) => {
    await openClassPage(page, testClass('TestData'));

    await expect(classPageHeading(page)).toContainText('TestData');
    await expect(tableSectionHeader(page, 'methods')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'enclosingClassExample' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'innerClassExample' }).first()).toBeVisible();
  });
});
