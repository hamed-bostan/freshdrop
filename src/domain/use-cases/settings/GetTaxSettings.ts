import type { TaxSettings } from "../../entities/TaxSettings";
import type { ITaxSettingsRepository } from "../../repositories/ITaxSettingsRepository";

export class GetTaxSettings {
  constructor(private readonly taxSettingsRepo: ITaxSettingsRepository) {}

  execute(): Promise<TaxSettings> {
    return this.taxSettingsRepo.get();
  }
}
