// loginOrchestrator.type.ts
export type PortalLoginResult = {
  /** True if the login attempt was successful */
  success: boolean;

  /** True if the authentication state was successfully persisted */
  authenticationStateSaved: boolean;
};
