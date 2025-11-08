// export interface ErrorDetails {
//   source: string;
//   context: string;
//   message: string;
//   url?: string;
//   details?: Record<string, unknown>;
//   timestamp: string;
//   environment: string;
//   stack?: string;
//   errorType?: string;
// }

// export type MatcherResult = {
//   expected?: unknown;
//   actual?: unknown;
//   received?: unknown;
//   message: string;
//   pass: boolean;
// };

// export type MatcherError = {
//   matcherResult: MatcherResult;
// };

export interface ErrorDetails {
  source: string;
  context: string;
  message: string;
  timestamp: string;
  environment: string;
  stack?: string;
  errorType?: string;
  pass?: boolean;
  matcherName?: string;
  expected?: unknown;
  received?: unknown;
  log?: string[];
  [key: string]: unknown;
}

export type MatcherResult = {
  message: string;
  pass: boolean;
  name?: string;
  expected?: unknown;
  actual?: unknown;
  received?: unknown;
  log?: string[];
};

export type MatcherError = {
  matcherResult: MatcherResult;
};
