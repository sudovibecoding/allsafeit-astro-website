/** Shared types for the ETL pipeline. */

export interface RunOptions {
  /** Absolute path to the project root (used as base for output paths). */
  projectRoot: string;
  /** If true, no files are written; downloads are stubbed. */
  dryRun: boolean;
  /** If true, asset downloads are skipped (URLs still registered in cache). */
  skipAssets: boolean;
  /** If set, only the first N items per collection are processed. */
  limit?: number;
  /** Subset of collection labels to run. If empty/undefined, run all. */
  only?: string[];
}

export interface CollectionReport {
  collection: string;
  items: number;
  errors: string[];
  warnings: string[];
}
