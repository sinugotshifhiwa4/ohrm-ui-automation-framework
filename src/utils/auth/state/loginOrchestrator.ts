import type { Page } from "@playwright/test";
import { BasePage } from "../../../layers/ui/base/basePage.js";
import { EnvironmentResolver } from "../../environment/resolver/environmentResolver.js";
import { LoginPage } from "../../../layers/ui/pages/loginPage.js";
import { AuthenticationStatePersister } from "./authenticationStatePersister.js";
import type { PortalLoginResult } from "./loginOrchestrator.type.js";
import ErrorHandler from "../../errorHandling/errorHandler.js";

export class LoginOrchestrator extends BasePage {
  private environmentResolver: EnvironmentResolver;
  private authStatePersister: AuthenticationStatePersister;
  private loginPage: LoginPage;

  // Flag to track if authentication state was saved
  private authenticationStateSaved = false;

  constructor(
    page: Page,
    environmentResolver: EnvironmentResolver,
    authStatePersister: AuthenticationStatePersister,
    loginPage: LoginPage,
  ) {
    super(page);
    this.environmentResolver = environmentResolver;
    this.authStatePersister = authStatePersister;
    this.loginPage = loginPage;
  }

  public async navigateToPortal(): Promise<void> {
    const portalUrl = await this.environmentResolver.getPortalBaseUrl();
    await this.loginPage.navigation.navigateToUrl(portalUrl, "navigateToPortal");
  }

  /**
   * Logs into the portal and optionally saves authentication state.
   * @param username - Portal username.
   * @param password - Portal password.
   * @param saveAuthState - Whether to save authentication state after login. Defaults to true.
   * @returns Result of the login attempt.
   */
  public async loginToPortal(
    username: string,
    password: string,
    saveAuthState: boolean = true,
  ): Promise<PortalLoginResult> {
    try {
      await this.navigateToPortal();
      await this.loginPage.login(username, password);

      if (saveAuthState) {
        // add method to validate login
        await this.authStatePersister.saveAuthenticationState();
        this.authenticationStateSaved = true;
      }

      return {
        success: true,
        authenticationStateSaved: this.authenticationStateSaved,
      };
    } catch (error) {
      ErrorHandler.captureError(error, "loginToPortal", "Failed to log into portal");
      throw error;
    }
  }
}
