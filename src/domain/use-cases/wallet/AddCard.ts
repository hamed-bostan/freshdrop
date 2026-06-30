import type { CardBrand, NewCard, SavedCard } from "../../entities/Wallet";
import type { IWalletRepository } from "../../repositories/IWalletRepository";
import { ValidationError } from "../../errors/ValidationError";

/**
 * Save a payment card. The domain owns the rules the persisted card must satisfy —
 * it derives the brand from the PAN, masks the number down to a PCI-safe last-4
 * display value (the full PAN and the CVV are never stored), and normalises the
 * expiry to `MM/YY` — so the repository only ever writes a clean, safe record.
 */
export class AddCard {
  constructor(private readonly walletRepo: IWalletRepository) {}

  async execute(userId: string, input: NewCard): Promise<SavedCard> {
    const digits = input.number.replace(/\D/g, "");
    if (digits.length < 12 || digits.length > 19) {
      throw new ValidationError("number", "Enter a valid card number.");
    }

    const holderName = input.holderName.trim();
    if (!holderName) {
      throw new ValidationError("holderName", "Cardholder name is required.");
    }

    const month = input.expiryMonth.trim().padStart(2, "0");
    if (!/^(0[1-9]|1[0-2])$/.test(month)) {
      throw new ValidationError("expiryMonth", "Enter a month between 01 and 12.");
    }

    const year = input.expiryYear.trim().slice(-2);
    if (!/^\d{2}$/.test(year)) {
      throw new ValidationError("expiryYear", "Enter a valid expiry year.");
    }

    return this.walletRepo.addCard(userId, {
      brand: brandFromNumber(digits),
      holderName,
      number: maskNumber(digits),
      expiry: `${month}/${year}`,
    });
  }
}

/** Infer the brand from the leading digits. Only the two brands the UI renders. */
function brandFromNumber(digits: string): CardBrand {
  return /^(5[1-5]|2[2-7])/.test(digits) ? "Mastercard" : "Visa";
}

/** Mask to the last four digits in the four-group display format the card face uses. */
function maskNumber(digits: string): string {
  return `•••• •••• •••• ${digits.slice(-4)}`;
}
