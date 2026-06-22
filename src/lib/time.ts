/**
 * Availability slot grid + office-timezone helpers.
 *
 * The grid is weekday business hours only (Mon-Fri), in fixed 30-minute slots.
 * A slot is identified by `slotKey = "{weekday}-{slotIndex}"`.
 */

export const LEAGUE_TIMEZONE = process.env.LEAGUE_TIMEZONE ?? "America/Indiana/Indianapolis";

export const SLOT_MINUTES = 30;
export const DAY_START_HOUR = 8; // 8:00 AM
export const DAY_END_HOUR = 18; // 6:00 PM
export const SLOTS_PER_DAY = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES; // 20

/** 0=Mon .. 4=Fri */
export const WEEKDAYS = [0, 1, 2, 3, 4] as const;
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export const WEEKDAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export function slotKey(weekday: number, slotIndex: number): string {
  return `${weekday}-${slotIndex}`;
}

export function parseSlotKey(key: string): { weekday: number; slotIndex: number } {
  const [w, s] = key.split("-").map(Number);
  return { weekday: w, slotIndex: s };
}

/** Minutes-from-midnight for the start of a slot. */
export function slotStartMinutes(slotIndex: number): number {
  return DAY_START_HOUR * 60 + slotIndex * SLOT_MINUTES;
}

function fmtTime(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

/** "8:00 AM" for the start of a slot. */
export function slotStartLabel(slotIndex: number): string {
  return fmtTime(slotStartMinutes(slotIndex));
}

/** "8:00 AM – 8:30 AM" for a single slot. */
export function slotRangeLabel(slotIndex: number): string {
  return `${fmtTime(slotStartMinutes(slotIndex))} – ${fmtTime(
    slotStartMinutes(slotIndex) + SLOT_MINUTES,
  )}`;
}

/** "Mon 12:00 PM" for a slot key. */
export function slotKeyLabel(key: string): string {
  const { weekday, slotIndex } = parseSlotKey(key);
  return `${WEEKDAY_LABELS[weekday] ?? "?"} ${slotStartLabel(slotIndex)}`;
}

/**
 * Build a concrete datetime for a slot. We treat the chosen slot as office
 * wall-clock time and store it as the equivalent UTC instant, then always
 * display with timeZone "UTC". This keeps the shown time identical to the slot
 * the group picked, without per-user timezone math (everyone's in-office).
 */
export function slotDateTimeUTC(
  baseMondayUTC: Date,
  weekday: number,
  slotIndex: number,
): Date {
  const d = new Date(baseMondayUTC.getTime());
  d.setUTCDate(d.getUTCDate() + weekday);
  const mins = slotStartMinutes(slotIndex);
  d.setUTCHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d;
}

/** UTC-midnight Monday of the week containing `date` (default: now). */
export function mondayOfWeekUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/** Format a stored schedule instant for display (wall-clock as UTC). */
export const scheduleFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});
