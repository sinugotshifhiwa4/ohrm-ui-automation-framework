import type { Page, Locator } from "@playwright/test";
import { BasePage } from "../base/basePage.js";

export class LoginPage extends BasePage {
  public readonly companyLogo: Locator;
  public readonly usernameInput: Locator;
  public readonly passwordInput: Locator;
  public readonly loginButton: Locator;
  private readonly invalidLoginErrorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.companyLogo = page.getByRole("img", { name: "company-branding" });
    this.usernameInput = page.getByRole("textbox", { name: "username" });
    this.passwordInput = page.getByRole("textbox", { name: "password" });
    this.loginButton = page.getByRole("button", { name: "Login" });
    this.invalidLoginErrorMessage = page
      .getByRole("alert")
      .locator("div")
      .filter({ hasText: "Invalid credentials" });
  }

  // Assertions

  public async verifyCompanyLogoIsVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.companyLogo,
      "verifyCompanyLogoIsVisible",
      "visible",
      "company logo",
    );
  }

  public async verifyUsernameInputIsVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.usernameInput,
      "verifyUsernameInputIsVisible",
      "visible",
      "username input",
    );
  }

  public async verifyPasswordInputIsVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.passwordInput,
      "verifyPasswordInputIsVisible",
      "visible",
      "password input",
    );
  }

  public async verifyLoginButtonIsVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.loginButton,
      "verifyLoginButtonIsVisible",
      "visible",
      "login button",
    );
  }

  public async verifyInvalidLoginErrorMessageIsVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.invalidLoginErrorMessage,
      "verifyInvalidLoginErrorMessageIsVisible",
      "visible",
      "invalid login error message",
    );
  }

  public async verifyInvalidLoginErrorMessageIsNotVisible(): Promise<void> {
    await this.elementAssertions.verifyElementState(
      this.invalidLoginErrorMessage,
      "verifyInvalidLoginErrorMessageIsNotVisible",
      "hidden",
      "invalid login error message",
    );
  }

  // Actions

  public async fillUsernameInput(username: string): Promise<void> {
    await this.element.fillElement(
      this.usernameInput,
      "fillUsernameInput",
      username,
      "username input",
    );
  }

  public async fillPasswordInput(password: string): Promise<void> {
    await this.element.fillElement(
      this.passwordInput,
      "fillPasswordInput",
      password,
      "password input",
    );
  }

  public async clickLoginButton(): Promise<void> {
    await this.element.clickElement(this.loginButton, "clickLoginButton", "login button");
  }

  // Interactions

  public async login(username: string, password: string): Promise<void> {
    await this.fillUsernameInput(username);
    await this.fillPasswordInput(password);
    await this.clickLoginButton();
    await this.verifyInvalidLoginErrorMessageIsNotVisible();
  }

  public async verifyLoginElementsAreVisible(): Promise<void> {
    await Promise.all([
      this.verifyCompanyLogoIsVisible(),
      this.verifyUsernameInputIsVisible(),
      this.verifyPasswordInputIsVisible(),
      this.verifyLoginButtonIsVisible(),
    ]);
  }
}
