export interface EncryptionEntry {
  timestamp: string;
  keyName: string;
  environment: string;
  variablesEncrypted: string[];
  totalVariables: number;
  skippedVariables: string[];
  alreadyEncrypted: string[];
  emptyVariables: string[];
  performedBy?: string;
  durationMs: number;
}

export interface EncryptionTrackingFile {
  encryptions: EncryptionEntry[];
  totalEncryptions: number;
  lastEncryption: string;
}

export interface EncryptionStats {
  totalEncryptions: number;
  totalVariablesEncrypted: number;
  lastEncryption?: string | undefined;
  mostRecentVariables?: string[] | undefined;
}
