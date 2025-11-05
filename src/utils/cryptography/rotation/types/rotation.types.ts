export interface RotationResult {
  success: boolean;
  keyName: string;
  environment: string;
  variablesProcessed: number;
  variablesFailed: string[];
  oldKeyHash?: string;
  newKeyHash?: string;
  duration: number;
}

export interface RotationOptions {
  rotationReason?: "scheduled" | "manual" | "compromised" | "expired";
  rotationDays?: number;
  performedBy?: string;
  forceRotation?: boolean;
  dryRun?: boolean;
}

export interface SecretKeyRotationEntry {
  keyName: string;
  environment: string;
  rotationDate: string;
  previousKeyHash?: string | undefined;
  newKeyHash?: string | undefined;
  rotationReason: "scheduled" | "manual" | "compromised" | "expired";
  performedBy?: string | undefined;
  success: boolean;
}

export interface SecretKeyRotationFile {
  rotations: SecretKeyRotationEntry[];
  lastRotation: string;
}

export interface RotationHistoryEntry {
  keyName: string;
  rotationDate: string;
  rotationReason: string;
  performedBy?: string | undefined;
  success: boolean;
}

export interface RotationStatusResult {
  needsRotation: boolean;
  recommendation: string;
  details: {
    daysUntilExpiration: number;
    status: string;
    encryptedVariableCount: number;
    metadata?:
      | {
          createdAt: string;
          rotationCount: number;
          lastRotatedAt?: string | undefined;
        }
      | undefined;
  };
}
