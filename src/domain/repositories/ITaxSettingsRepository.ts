import type { TaxSettings } from "../entities/TaxSettings";

/** What the settings screen writes when it saves the rate. */
export type TaxSettingsInput = {
  ratePercent: number;
  enabled: boolean;
  updatedById: string;
};

export type ITaxSettingsRepository = {
  /** The singleton row, lazily created with its schema defaults on first read. */
  get(): Promise<TaxSettings>;
  update(input: TaxSettingsInput): Promise<TaxSettings>;
};
