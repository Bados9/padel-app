import type {
  PlayerLevel,
  CourtSurface,
  UserRole,
  ReservationStatus,
  ReservationVisibility,
} from "@prisma/client";

export const LEVEL_LABEL: Record<PlayerLevel, string> = {
  BEGINNER: "Začátečník",
  INTERMEDIATE: "Mírně pokročilý",
  ADVANCED: "Pokročilý",
  PRO: "Závodní",
};

export const LEVEL_SHORT: Record<PlayerLevel, string> = {
  BEGINNER: "Začátečník",
  INTERMEDIATE: "Mírně pok.",
  ADVANCED: "Pokročilý",
  PRO: "Závodní",
};

export const SURFACE_LABEL: Record<CourtSurface, string> = {
  ARTIFICIAL_GRASS: "Umělá tráva",
  CARPET: "Koberec",
  CONCRETE: "Beton",
};

export const VISIBILITY_LABEL: Record<ReservationVisibility, string> = {
  PRIVATE: "Soukromá",
  PUBLIC: "Otevřená",
};

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  CONFIRMED: "Potvrzená",
  CANCELLED: "Zrušená",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  USER: "Hráč",
  ADMIN: "Administrátor",
};

// Plurál: [1, 2-4, 5+]
export function pluralCs(n: number, forms: [string, string, string]): string {
  if (n === 1) return forms[0];
  if (n >= 2 && n <= 4) return forms[1];
  return forms[2];
}

export function playersLabel(n: number): string {
  return `${n} ${pluralCs(n, ["hráč", "hráči", "hráčů"])}`;
}

export function spotsLabel(n: number): string {
  return `${n} ${pluralCs(n, ["volné místo", "volná místa", "volných míst"])}`;
}

// Relativní čas: "za 3 h", "zítra 18:00", "za 2 dny", pro minulost "před 1 h", "včera"
export function relativeTimeCs(target: Date, now: Date = new Date()): string {
  const ms = target.getTime() - now.getTime();
  const mins = Math.round(ms / 60_000);
  const abs = Math.abs(mins);
  const future = mins >= 0;

  if (abs < 60) {
    if (abs < 2) return future ? "teď" : "před chvílí";
    return future ? `za ${abs} min` : `před ${abs} min`;
  }
  const hours = Math.round(abs / 60);
  if (hours < 24) {
    return future
      ? `za ${hours} ${pluralCs(hours, ["hodinu", "hodiny", "hodin"])}`
      : `před ${hours} ${pluralCs(hours, ["hodinou", "hodinami", "hodinami"])}`;
  }
  const days = Math.round(abs / (60 * 24));
  if (days < 7) {
    return future
      ? `za ${days} ${pluralCs(days, ["den", "dny", "dní"])}`
      : `před ${days} ${pluralCs(days, ["dnem", "dny", "dny"])}`;
  }
  return future ? `za ${days} dní` : `před ${days} dny`;
}
