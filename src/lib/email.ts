import { readFileSync } from "fs";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "";
const from = process.env.RESEND_FROM || "TDVX Banking <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

// Read the logo once at startup and inline it as a CID attachment so it renders
// in the email without depending on a public asset URL.
let logoBase64 = "";
try {
  logoBase64 = readFileSync(new URL("../../assets/logo.png", import.meta.url)).toString("base64");
} catch {
  logoBase64 = "";
}

function buildHtml(code: string, verifyUrl: string) {
  const logo = logoBase64
    ? `<img src="cid:tdvx-logo" width="56" height="56" alt="TDVX Banking" style="display:block;margin:0 auto 12px" />`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f5f7fa;font-family:Inter,Segoe UI,system-ui,-apple-system,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #dfeaf2;border-radius:25px;padding:36px">
            <tr>
              <td align="center" style="padding-bottom:8px">
                ${logo}
                <div style="font-size:20px;font-weight:700;color:#343c6a">TDVX Banking</div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 0 4px">
                <div style="font-size:18px;font-weight:600;color:#343c6a">Verify your sign-in</div>
                <div style="font-size:14px;color:#718ebf;padding-top:6px;line-height:1.5">
                  Use the code below to finish signing in. It expires in 10 minutes.
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 0">
                <div style="font-size:34px;font-weight:700;letter-spacing:12px;color:#1814f3;background:#f5f7fa;border-radius:15px;padding:20px 8px">
                  ${code}
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:4px 0 8px">
                <a href="${verifyUrl}" style="display:inline-block;background:#1814f3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:12px">
                  Open verification page
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:20px">
                <div style="font-size:12px;color:#8ba3cb;line-height:1.5">
                  If you didn't try to sign in, you can safely ignore this email.
                </div>
              </td>
            </tr>
          </table>
          <div style="font-size:11px;color:#8ba3cb;padding-top:16px">TDVX Banking &middot; Finance Console</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const replyTo = process.env.RESEND_REPLY_TO || "support@tdvx.site";

function buildText(code: string, verifyUrl: string) {
  return [
    "TDVX Banking — verify your sign-in",
    "",
    `Your verification code is: ${code}`,
    "It expires in 10 minutes.",
    "",
    `Verify here: ${verifyUrl}`,
    "",
    "If you didn't try to sign in, you can safely ignore this email.",
    "TDVX Banking",
  ].join("\n");
}

export async function sendOtpEmail(to: string, code: string, verifyUrl: string) {
  const subject = "Your TDVX Banking verification code";
  const html = buildHtml(code, verifyUrl);
  const text = buildText(code, verifyUrl);

  if (!resend) {
    console.log(`[email:dev] OTP for ${to}: ${code}  (verify: ${verifyUrl})`);
    return { id: "dev-console" };
  }

  const { data, error } = await resend.emails.send({
    from,
    to,
    replyTo,
    subject,
    html,
    text, // multipart/alternative — HTML-only mail scores much worse with spam filters
    attachments: logoBase64
      ? [{ filename: "logo.png", content: logoBase64, inlineContentId: "tdvx-logo" }]
      : undefined,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error("email_send_failed");
  }
  return data;
}
