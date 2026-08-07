"use client";

import * as React from "react";

import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import { useSessionStorageState } from "@/src/lib/hooks/useSessionStorageState";

import { NOTES_STORAGE_KEY, SLOT_STORAGE_KEY, SUBSTITUTIONS_STORAGE_KEY, firstBookableSlot, reviveSlot, reviveSubstitutions } from "./checkoutSession";

import type { SlotSelection } from "./components/DeliverySlotPicker";

export function useCheckoutSubstitutions() {
  return useSessionStorageState<Record<string, SubstitutionPreference>>(SUBSTITUTIONS_STORAGE_KEY, {}, reviveSubstitutions);
}

export function useCheckoutDraft(days: DeliverySlotDay[]) {
  const defaultSlot = React.useMemo(() => firstBookableSlot(days), [days]);
  const [slot, setSlot, clearSlot] = useSessionStorageState<SlotSelection | null>(SLOT_STORAGE_KEY, defaultSlot, (stored) => reviveSlot(days, defaultSlot, stored));
  const [substitutions, setSubstitutions, clearSubstitutions] = useCheckoutSubstitutions();
  const [notes, setNotes, clearNotes] = useSessionStorageState<string>(NOTES_STORAGE_KEY, "", (stored) => typeof stored === "string" ? stored : "");
  const clear = React.useCallback(() => { clearSlot(); clearSubstitutions(); clearNotes(); }, [clearSlot, clearSubstitutions, clearNotes]);
  return { slot, setSlot, substitutions, setSubstitutions, notes, setNotes, clear };
}
