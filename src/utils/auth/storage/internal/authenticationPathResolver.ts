import { SyncFileManager } from "../../../fileManager/syncFileManager.js";
import { AUTH_FILE_CONFIG } from "./authentication.constants.js";

export default class AuthenticationPathResolver {
  public static getCIFilePath(): string {
    return SyncFileManager.join(this.getRootDir(), AUTH_FILE_CONFIG.CI_AUTH_FILE);
  }

  public static getLocalFilePath(): string {
    return SyncFileManager.join(this.getRootDir(), AUTH_FILE_CONFIG.LOCAL_AUTH_FILE);
  }

  public static getEmptyAuthState(): string {
    return AUTH_FILE_CONFIG.EMPTY_AUTH_STATE;
  }

  private static getRootDir(): string {
    const rootDir = SyncFileManager.resolve(AUTH_FILE_CONFIG.ROOT_DIRECTORY);
    SyncFileManager.ensureDirectoryExists(rootDir);
    return rootDir;
  }
}
