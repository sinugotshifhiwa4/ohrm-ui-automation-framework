import type { Browser, BrowserContext, Page } from "@playwright/test";
import type { BrowserContextWithPage } from "./browserContext.type.js";

export class BrowserContextManager {
  private readonly browser: Browser;
  private page?: Page;
  constructor(browser: Browser) {
    this.browser = browser;
  }

  public async createDefaultContext(): Promise<BrowserContextWithPage> {
    const context = await this.browser.newContext();
    const page = await context.newPage();
    return { context, page };
  }

  public async createIsolatedContext(): Promise<BrowserContextWithPage> {
    // @ts-expect-error: Explicitly setting storageState to undefined to ensure isolated context
    const context = await this.browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    return { context, page };
  }

  public async close(context: BrowserContext): Promise<void> {
    if (context) {
      await context.close();
    }
  }

  public async clickAndWaitForNewPage(page: Page, clickFn: () => Promise<void>): Promise<Page> {
    const [newPage] = await Promise.all([page.context().waitForEvent("page"), clickFn()]);
    await newPage.waitForLoadState();
    return newPage;
  }
}
