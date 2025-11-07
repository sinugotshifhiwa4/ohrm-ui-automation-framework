import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base/basePage.js";

export class SideBarMenu extends BasePage {
  private readonly banner: Locator;
  private readonly searchInput: Locator;
  private readonly adminMenu: Locator;
  private readonly pimMenu: Locator;
  private readonly leaveMenu: Locator;
  private readonly myInfoMenu: Locator;

  private readonly collapseSideMenuButton: Locator;
  private readonly expandSideMenuButton: Locator;

  constructor(page: Page) {
    super(page);
    this.banner = page.getByRole("link", { name: "client brand banner" });
    this.searchInput = page.getByRole("textbox", { name: "Search" });
    this.adminMenu = page.getByRole("link", { name: "Admin" });
    this.pimMenu = page.getByRole("link", { name: "PIM" });
    this.leaveMenu = page.getByRole("link", { name: "Leave" });
    this.myInfoMenu = page.getByRole("link", { name: "My Info" });

    this.collapseSideMenuButton = page
      .locator("div.oxd-main-menu-search button")
      .filter({ has: page.locator("i.oxd-icon.bi-chevron-left") });

    this.expandSideMenuButton = page
      .locator("div.oxd-main-menu-search button")
      .filter({ has: page.locator("i.oxd-icon.bi-chevron-right") });
  }

  // Assertions

  public async verifySideBarElementsAreVisible(): Promise<void> {
    await Promise.all([
      this.verifyBannerIsVisible(),
      this.verifySearchInputIsVisible(),
      this.verifyAdminMenuIsVisible(),
      this.verifyPimMenuIsVisible(),
      this.verifyLeaveMenuIsVisible(),
      this.verifyMyInfoMenuIsVisible(),
    ]);
  }

  public async verifyBannerIsVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.banner,
      "verifyBannerIsVisible",
      "visible",
      "banner",
    );
  }

  private async verifySearchInputIsVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.searchInput,
      "verifySearchInputIsVisible",
      "visible",
      "search input",
    );
  }

  private async verifyAdminMenuIsVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.adminMenu,
      "verifyAdminMenuIsVisible",
      "visible",
      "admin menu",
    );
  }

  private async verifyPimMenuIsVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.pimMenu,
      "verifyPimMenuIsVisible",
      "visible",
      "pim menu",
    );
  }

  private async verifyLeaveMenuIsVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.leaveMenu,
      "verifyLeaveMenuIsVisible",
      "visible",
      "leave menu",
    );
  }

  private async verifyMyInfoMenuIsVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.myInfoMenu,
      "verifyMyInfoMenuIsVisible",
      "visible",
      "my info menu",
    );
  }

  // Actions

  private async fillSearchInput(keyword: string): Promise<void> {
    await this.element.fillElement(this.searchInput, "fillSearchInput", keyword, "search input");
  }

  private async clickAdminMenu(): Promise<void> {
    await this.element.clickElement(this.adminMenu, "clickAdminMenu", "admin menu");
  }

  private async clickPimMenu(): Promise<void> {
    await this.element.clickElement(this.pimMenu, "clickPimMenu", "pim menu");
  }

  private async clickLeaveMenu(): Promise<void> {
    await this.element.clickElement(this.leaveMenu, "clickLeaveMenu", "leave menu");
  }

  private async clickMyInfoMenu(): Promise<void> {
    await this.element.clickElement(this.myInfoMenu, "clickMyInfoMenu", "my info menu");
  }
}
