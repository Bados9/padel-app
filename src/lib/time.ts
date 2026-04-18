import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";
import { CLUB_TZ, SLOT_MINUTES } from "@/lib/club";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function isValidDateString(s: string): boolean {
  return DATE_RE.test(s);
}

export function todayInClubTz(): string {
  return formatInTimeZone(new Date(), CLUB_TZ, "yyyy-MM-dd");
}

export function formatDateCZ(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, CLUB_TZ, "EEEEEE d. M. yyyy");
}

export function formatTimeCZ(date: Date): string {
  return formatInTimeZone(date, CLUB_TZ, "HH:mm");
}

export function formatDateTimeCZ(date: Date): string {
  return formatInTimeZone(date, CLUB_TZ, "d. M. yyyy HH:mm");
}

// Den v týdnu podle naší konvence: 0 = pondělí ... 6 = neděle
export function clubDayOfWeek(dateString: string): number {
  if (!isValidDateString(dateString)) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  const utcNoon = fromZonedTime(`${dateString}T12:00:00`, CLUB_TZ);
  const zoned = toZonedTime(utcNoon, CLUB_TZ);
  const jsDay = zoned.getDay(); // 0 = neděle ... 6 = sobota
  return (jsDay + 6) % 7;
}

// Převede "YYYY-MM-DD" + "HH:MM" v klubové TZ na UTC Date
export function clubLocalToUtc(dateString: string, timeString: string): Date {
  if (!isValidDateString(dateString) || !TIME_RE.test(timeString)) {
    throw new Error(`Invalid date/time: ${dateString} ${timeString}`);
  }
  return fromZonedTime(`${dateString}T${timeString}:00`, CLUB_TZ);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function diffMinutes(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60_000);
}

// Minuty od půlnoci pro "HH:MM"
function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export type DaySlot = {
  startAt: Date; // UTC
  endAt: Date; // UTC
  startLabel: string; // "HH:mm" v klubové TZ
  endLabel: string;
};

// Vygeneruje sloty pro daný den mezi opening hours
export function generateDaySlots(
  dateString: string,
  opening: { startTime: string; endTime: string },
): DaySlot[] {
  const startMin = parseTimeToMinutes(opening.startTime);
  const endMin = parseTimeToMinutes(opening.endTime);
  const slots: DaySlot[] = [];
  for (let m = startMin; m + SLOT_MINUTES <= endMin; m += SLOT_MINUTES) {
    const startH = Math.floor(m / 60)
      .toString()
      .padStart(2, "0");
    const startM = (m % 60).toString().padStart(2, "0");
    const endH = Math.floor((m + SLOT_MINUTES) / 60)
      .toString()
      .padStart(2, "0");
    const endM = ((m + SLOT_MINUTES) % 60).toString().padStart(2, "0");
    const startLabel = `${startH}:${startM}`;
    const endLabel = `${endH}:${endM}`;
    slots.push({
      startAt: clubLocalToUtc(dateString, startLabel),
      endAt: clubLocalToUtc(dateString, endLabel),
      startLabel,
      endLabel,
    });
  }
  return slots;
}

export function shiftDate(dateString: string, deltaDays: number): string {
  const base = fromZonedTime(`${dateString}T12:00:00`, CLUB_TZ);
  const shifted = new Date(base.getTime() + deltaDays * 24 * 60 * 60_000);
  return formatInTimeZone(shifted, CLUB_TZ, "yyyy-MM-dd");
}
