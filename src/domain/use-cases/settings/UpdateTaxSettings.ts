import type { TaxSettings } from "../../entities/TaxSettings";
import type { ITaxSettingsRepository } from "../../repositories/ITaxSettingsRepository";
import { ValidationError } from "../../errors/ValidationError";

export type UpdateTaxSettingsInput = {
  ratePercent: number;
  enabled: boolean;
};

export class UpdateTaxSettings {
  constructor(private readonly taxSettingsRepo: ITaxSettingsRepository) {}

  execute(input: UpdateTaxSettingsInput, actorId: string): Promise<TaxSettings> {
    // Re-checked here, behind the client form's schema — the last-resort guard
    // every use-case applies rather than trusting a validated-looking request.
    if (input.ratePercent < 0 || input.ratePercent > 100) {
      throw new ValidationError("ratePercent", "Rate must be between 0 and 100.");
    }

    return this.taxSettingsRepo.update({
      ratePercent: input.ratePercent,
      enabled: input.enabled,
      updatedById: actorId,
    });
  }
}
