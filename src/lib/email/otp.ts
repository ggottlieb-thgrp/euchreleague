import { sendEmail } from "./send";

const SLATE = "#333F48";
const YELLOW = "#FFC72C";

export async function sendOtpEmail(to: string, code: string) {
  const html = `
  <div style="font-family:Arial,Segoe UI,sans-serif;background:#D9D9D6;padding:32px;">
    <div style="max-width:440px;margin:0 auto;background:#fff;border-radius:12px;border-left:4px solid ${YELLOW};overflow:hidden;">
      <div style="background:${SLATE};padding:20px 24px;">
        <span style="color:#fff;font-size:18px;font-weight:800;">Euchre League</span>
        <span style="color:${YELLOW};font-size:11px;letter-spacing:.18em;text-transform:uppercase;display:block;">The Heritage Group</span>
      </div>
      <div style="padding:28px 24px;color:${SLATE};">
        <p style="margin:0 0 12px;font-size:15px;">Your sign-in code is:</p>
        <div style="font-size:34px;font-weight:800;letter-spacing:.32em;color:${SLATE};background:#F4F4F2;border-radius:10px;padding:16px 0;text-align:center;">${code}</div>
        <p style="margin:18px 0 0;font-size:13px;color:#556270;">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>
    </div>
  </div>`;

  return sendEmail({
    to,
    subject: `${code} is your THG Euchre League sign-in code`,
    html,
    text: `Your THG Euchre League sign-in code is ${code}. It expires in 10 minutes.`,
    category: "auth",
    userId: null,
  });
}
