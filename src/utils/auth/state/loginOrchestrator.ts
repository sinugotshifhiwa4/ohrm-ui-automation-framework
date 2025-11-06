import type { Page } from "@playwright/test";
import { BasePage } from "../../../layers/ui/base/basePage.js";
import { EnvironmentResolver } from "../../environment/resolver/environmentResolver.js";
import { LoginPage } from "../../../layers/ui/pages/loginPage.js";
import { SideBarMenu } from "../../../layers/ui/pages/sideBarMenu.js";
import { AuthenticationStatePersister } from "./authenticationStatePersister.js";
import type { PortalLoginResult, LoginOptions } from "./loginOrchestrator.type.js";
import ErrorHandler from "../../errorHandling/errorHandler.js";

export class LoginOrchestrator extends BasePage {
  private environmentResolver: EnvironmentResolver;
  private authStatePersister: AuthenticationStatePersister;
  private loginPage: LoginPage;
  private sideBarMenu: SideBarMenu;

  constructor(
    page: Page,
    environmentResolver: EnvironmentResolver,
    authStatePersister: AuthenticationStatePersister,
    loginPage: LoginPage,
    sideBarMenu: SideBarMenu,
  ) {
    super(page);
    this.environmentResolver = environmentResolver;
    this.authStatePersister = authStatePersister;
    this.loginPage = loginPage;
    this.sideBarMenu = sideBarMenu;
  }

  public async navigateToPortal(): Promise<void> {
    const portalUrl = await this.environmentResolver.getPortalBaseUrl();
    await this.loginPage.navigation.navigateToUrl(portalUrl, "navigateToPortal");
  }

  /**
   * Logs into the portal with the provided username and password.
   * Optionally, it can be instructed to not save the authentication state.
   * If the login is successful, it will verify that the side bar menu elements are visible and save the authentication state.
   * If the login is unsuccessful, it will verify that the invalid login error message is visible.
   * @param {string} username The username to log in with.
   * @param {string} password The password to log in with.
   * @param {LoginOptions} options Optional login options.
   * @returns {Promise<PortalLoginResult>} A promise that resolves to a PortalLoginResult object, containing information about the login attempt.
   */
  public async loginToPortal(
    username: string,
    password: string,
    options: LoginOptions = {},
  ): Promise<PortalLoginResult> {
    const { saveAuthenticationState = true } = options;

    try {
      await this.navigateToPortal();
      await this.loginPage.login(username, password);

      if (!saveAuthenticationState) {
        await this.loginPage.verifyInvalidLoginErrorMessageIsVisible();
        return { success: false, authenticationStateSaved: false };
      }

      await this.loginPage.verifyInvalidLoginErrorMessageIsNotVisible();
      await this.sideBarMenu.verifySideBarElementsAreVisible();
      await this.authStatePersister.saveAuthenticationState();

      return { success: true, authenticationStateSaved: true };
    } catch (error) {
      ErrorHandler.captureError(
        error,
        "LoginOrchestrator.loginToPortal",
        "Failed to log into portal",
      );
      throw error;
    }
  }
}
