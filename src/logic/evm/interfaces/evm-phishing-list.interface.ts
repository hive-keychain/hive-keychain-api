export interface EvmPhishingList {
  whitelist: string[];
  blacklist: string[];
  fuzzylist: string[];
  tolerance: number;
  version: number;
}
