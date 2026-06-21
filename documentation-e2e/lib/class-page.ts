import { expect, type Page } from '@playwright/test';
import {
  goHomeViaPageHeader,
  globalBindingsHeader,
  POST_HOME_EXPECT_TIMEOUT_MS,
} from './documentation-fixture';

export const TEST_CLASS_PACKAGE = 'pie.ilikepiefoo.kubejsoffline.testclasses';

export function testClass(simpleName: string): string {
  return `${TEST_CLASS_PACKAGE}.${simpleName}`;
}

/** Nested / inner classes use `$` segments in hash URLs (Java FQN), not dot-separated simple names. */
export function nestedTestClass(outer: string, ...innerSegments: string[]): string {
  return `${TEST_CLASS_PACKAGE}.${outer}${innerSegments.map((segment) => `$${segment}`).join('')}`;
}

export async function ensureDocumentationHome(page: Page): Promise<void> {
  if (await globalBindingsHeader(page).isVisible()) {
    return;
  }
  await goHomeViaPageHeader(page);
}

export async function openClassPage(page: Page, classDefinition: string): Promise<void> {
  await page.evaluate((definition) => {
    location.hash = definition;
  }, classDefinition);

  await expect(classPageHeading(page)).toBeVisible({ timeout: POST_HOME_EXPECT_TIMEOUT_MS });
}

export function classPageHeading(page: Page) {
  return page.locator('body > h3:not([id])');
}

export function tableSectionHeader(page: Page, tableId: string) {
  return page.locator(`#${tableId}-header`);
}

export function bindingRow(page: Page, scope: string, bindingName: string) {
  return page.locator(`#${scope}-bindings-${bindingName}`);
}

export async function openClassViaBindingLink(
  page: Page,
  scope: string,
  bindingName: string,
): Promise<void> {
  await ensureDocumentationHome(page);
  await bindingRow(page, scope, bindingName).locator('.link').first().click();
  await expect(classPageHeading(page)).toBeVisible({ timeout: POST_HOME_EXPECT_TIMEOUT_MS });
}

export async function returnHomeFromClassPage(page: Page): Promise<void> {
  await goHomeViaPageHeader(page);
}
