/** Minimal RFC-5545 .ics generator. Times are emitted as UTC (Z). */
export function buildIcs(opts: {
  uid: string;
  title: string;
  start: Date;
  durationMin: number;
  location?: string | null;
  description?: string;
}): string {
  const end = new Date(opts.start.getTime() + opts.durationMin * 60_000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//THG Euchre League//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${fmt(new Date(0))}`,
    `DTSTART:${fmt(opts.start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(opts.title)}`,
    opts.location ? `LOCATION:${esc(opts.location)}` : "",
    opts.description ? `DESCRIPTION:${esc(opts.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
