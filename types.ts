export enum Mode {
  DOT = 'DOT',
  PLUS = 'PLUS'
}

export enum Separator {
  PLUS = '+',
  UNDERSCORE = '_',
  HYPHEN = '-'
}

export interface VariationResult {
  email: string;
  isFavorite: boolean;
  sourceEmail?: string; // For batch mode identification
}

export interface GenerationStats {
  total: number;
  avgLength: number;
  maxDots: number;
  domain: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string; // Single email or batch string
  mode: Mode;
  tags?: string;
  separator?: Separator;
  count: number;
  isBatch: boolean;
}
