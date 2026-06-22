const SLATE = "#333F48";
const YELLOW = "#FFC72C";
const MIST = "#D9D9D6";
const APP_URL = process.env.AUTH_URL ?? "https://thgeuchre.com";

function layout(bodyHtml: string): string {
  return `
  <div style="font-family:Arial,Segoe UI,sans-serif;background:${MIST};padding:28px;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border-left:4px solid ${YELLOW};overflow:hidden;">
      <div style="background:${SLATE};padding:18px 24px;">
        <span style="color:#fff;font-size:17px;font-weight:800;">Euchre League</span>
        <span style="color:${YELLOW};font-size:10px;letter-spacing:.18em;text-transform:uppercase;display:block;">The Heritage Group</span>
      </div>
      <div style="padding:24px;color:${SLATE};line-height:1.5;">
        ${bodyHtml}
      </div>
      <div style="padding:14px 24px;border-top:1px solid #eee;color:#888;font-size:11px;">
        You're receiving this because you're in the THG Euchre League.
        <a href="${APP_URL}/settings/notifications" style="color:#556270;">Manage emails</a>.
      </div>
    </div>
  </div>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${YELLOW};color:${SLATE};font-weight:700;text-decoration:none;padding:10px 18px;border-radius:8px;margin-top:14px;">${label}</a>`;
}

export function weeklyScheduleEmail(opts: {
  weekNumber: number;
  partners: string[];
}): { subject: string; html: string; text: string } {
  const partners = opts.partners.join(", ");
  return {
    subject: `Week ${opts.weekNumber} pairings are up`,
    html: layout(
      `<h2 style="margin:0 0 10px;">You're on for Week ${opts.weekNumber}</h2>
       <p>Your group this week: <strong>${partners}</strong>.</p>
       <p>Head to the app to find a time and place to play, and remember scores are due Friday.</p>
       ${button(`${APP_URL}/pairings`, "View your matchup")}`,
    ),
    text: `Week ${opts.weekNumber} pairings are up. Your group: ${partners}. Visit ${APP_URL}/pairings`,
  };
}

export function scheduleProposedEmail(opts: {
  proposer: string;
  when: string;
  location: string | null;
  matchupId: number;
}): { subject: string; html: string; text: string } {
  const where = opts.location ? ` at ${opts.location}` : "";
  return {
    subject: `${opts.proposer} proposed a game time`,
    html: layout(
      `<h2 style="margin:0 0 10px;">A time was proposed</h2>
       <p><strong>${opts.proposer}</strong> proposed <strong>${opts.when}</strong>${where}.</p>
       <p>Confirm it works for you in the app.</p>
       ${button(`${APP_URL}/matchups/${opts.matchupId}/schedule`, "Review &amp; confirm")}`,
    ),
    text: `${opts.proposer} proposed ${opts.when}${where}. Confirm at ${APP_URL}/matchups/${opts.matchupId}/schedule`,
  };
}

export function scheduleConfirmedEmail(opts: {
  when: string;
  location: string | null;
}): { subject: string; html: string; text: string } {
  const where = opts.location ? ` at ${opts.location}` : "";
  return {
    subject: `Game on — ${opts.when}`,
    html: layout(
      `<h2 style="margin:0 0 10px;">Your game is confirmed</h2>
       <p><strong>${opts.when}</strong>${where}.</p>
       <p>A calendar invite is attached. See you at the table!</p>`,
    ),
    text: `Your euchre game is confirmed for ${opts.when}${where}.`,
  };
}

export function scoresDueEmail(opts: { weekNumber: number }): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: `Reminder: Week ${opts.weekNumber} scores due Friday`,
    html: layout(
      `<h2 style="margin:0 0 10px;">Don't forget to enter your scores</h2>
       <p>Week ${opts.weekNumber} scores are due Friday. It only takes a minute.</p>
       ${button(`${APP_URL}/scores`, "Enter scores")}`,
    ),
    text: `Week ${opts.weekNumber} scores are due Friday. Enter them at ${APP_URL}/scores`,
  };
}

export function gameReminderEmail(opts: {
  when: string;
  location: string | null;
}): { subject: string; html: string; text: string } {
  const where = opts.location ? ` at ${opts.location}` : "";
  return {
    subject: `Euchre today — ${opts.when}`,
    html: layout(
      `<h2 style="margin:0 0 10px;">You've got a game coming up</h2>
       <p><strong>${opts.when}</strong>${where}. Good luck!</p>`,
    ),
    text: `Reminder: euchre ${opts.when}${where}.`,
  };
}
