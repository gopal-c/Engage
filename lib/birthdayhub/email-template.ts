interface Palette { id: string; label: string; bg: string; }

export const SUNRISE_PALETTES: Palette[] = [
  { id: "sunrise",    label: "Sunrise",    bg: "linear-gradient(180deg,#ffe4d6 0%,#ffd4c2 35%,#f9c4d4 70%,#e8c8ec 100%)" },
  { id: "mint-marine",label: "Mint Marine",bg: "linear-gradient(180deg,#e6f5e6 0%,#c8ecdf 40%,#b8dde8 75%,#c8d4f0 100%)" },
  { id: "honey-gold", label: "Honey Gold", bg: "linear-gradient(180deg,#fff4d6 0%,#fae0a0 35%,#e8b870 70%,#c08838 100%)" },
  { id: "lilac-dawn", label: "Lilac Dawn", bg: "linear-gradient(180deg,#f5e8ff 0%,#e0d0f5 35%,#c8bce8 70%,#a8b0d8 100%)" },
  { id: "citrus-sky", label: "Citrus Sky", bg: "linear-gradient(180deg,#fef8d6 0%,#fae8a8 30%,#d8e8c0 65%,#b8d4e8 100%)" },
  { id: "ember",      label: "Ember",      bg: "linear-gradient(180deg,#ffe0d0 0%,#ff9c80 35%,#d8485c 70%,#6a1d34 100%)" },
];

export function resolvePalette(id?: string): Palette {
  return (id && SUNRISE_PALETTES.find((p) => p.id === id)) ||
    SUNRISE_PALETTES[Math.floor(Math.random() * SUNRISE_PALETTES.length)];
}

function formatDate(): string {
  const now = new Date();
  const day = now.getDate();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function twoSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!sentences) return text;
  return sentences.slice(0, 2).join("").trim();
}

function esc(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildEmailHTML(
  name: string,
  department: string,
  message: string,
  fromName = "The HR Team",
  illustrationIndex?: number,
  mood = "Sunny",
  fuel = "Coffee",
  logoUrl?: string,
  heroImageUrl?: string,
  paletteId?: string
): string {
  const palette = resolvePalette(paletteId);

  const escaped = {
    name: esc(name),
    msg:  esc(twoSentences(message)).replace(/\n/g, "<br>"),
    from: esc(fromName),
    date: esc(formatDate()),
    mood: esc(mood),
    fuel: esc(fuel),
  };

  const logoPill = logoUrl
    ? `<span style="display:inline-block;background:#ffffff;border-radius:12px;
                    padding:8px 12px;
                    box-shadow:0 4px 16px -6px rgba(58,26,42,0.18),0 1px 0 rgba(255,255,255,0.7) inset;">
         <img src="${esc(logoUrl)}" alt="Rezolve" height="22"
              style="display:block;height:22px;width:auto;border:0;" />
       </span>`
    : `<span style="display:inline-block;background:#ffffff;border-radius:12px;
                    padding:8px 14px;
                    box-shadow:0 4px 16px -6px rgba(58,26,42,0.18),0 1px 0 rgba(255,255,255,0.7) inset;
                    font-size:13px;font-weight:700;color:#3a1a2a;
                    font-family:'Inter Tight',system-ui,sans-serif;letter-spacing:-0.01em;">
         &#x1f388; Rezolve
       </span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Happy Birthday, ${escaped.name}!</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f5e8e0;font-family:'Inter Tight',system-ui,-apple-system,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <!-- Gradient card -->
      <table width="640" cellpadding="0" cellspacing="0" role="presentation"
        style="background:${palette.bg};border-radius:32px;overflow:hidden;">
        <tr>
          <td style="padding:32px 28px 28px;">

            <!-- Header row: logo + date -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="margin-bottom:24px;">
              <tr>
                <td>${logoPill}</td>
                <td align="right">
                  <span style="display:inline-block;background:rgba(255,255,255,0.6);
                               border-radius:999px;padding:8px 14px;
                               font-size:12px;font-weight:600;color:#3a1a2a;
                               font-family:'Inter Tight',system-ui,sans-serif;
                               letter-spacing:0.04em;">
                    ${escaped.date}
                  </span>
                </td>
              </tr>
            </table>

            <!-- Hero illustration -->
            ${heroImageUrl ? `<img src="${heroImageUrl}" width="600" height="240" alt="Birthday celebration" style="display:block;width:100%;border-radius:12px;border:0;outline:none;" />` : ''}

            <!-- Glass card -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:rgba(255,255,255,0.88);border-radius:28px;
                     border:1px solid rgba(255,255,255,0.7);
                     box-shadow:0 20px 60px -20px rgba(58,26,42,0.18);
                     margin-top:24px;">
              <tr>
                <td style="padding:32px 32px 28px;">

                  <div style="font-size:32px;font-weight:600;color:#3a1a2a;
                              letter-spacing:-0.025em;line-height:1.1;
                              font-family:'Inter Tight',system-ui,sans-serif;">
                    Happy birthday,<span style="color:#d96a3a;font-style:italic;font-weight:500;"> ${escaped.name}.</span>
                  </div>

                  <div style="font-size:15.5px;line-height:1.6;color:#4a2a3a;
                              margin-top:22px;
                              font-family:'Inter Tight',system-ui,sans-serif;">
                    ${escaped.msg}
                  </div>

                  <!-- Stats row -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                    style="margin-top:28px;">
                    <tr>
                      <td width="33%" style="padding-right:5px;vertical-align:top;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                          style="background:rgba(255,255,255,0.55);border-radius:14px;border:1px solid rgba(255,255,255,0.8);">
                          <tr><td style="padding:12px 14px;">
                            <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#3a1a2a;opacity:0.55;font-weight:600;font-family:'Inter Tight',system-ui,sans-serif;">Today</div>
                            <div style="font-size:22px;margin-top:4px;line-height:1;">&#x1f382;</div>
                          </td></tr>
                        </table>
                      </td>
                      <td width="33%" style="padding:0 5px;vertical-align:top;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                          style="background:rgba(255,255,255,0.55);border-radius:14px;border:1px solid rgba(255,255,255,0.8);">
                          <tr><td style="padding:12px 14px;">
                            <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#3a1a2a;opacity:0.55;font-weight:600;font-family:'Inter Tight',system-ui,sans-serif;">Mood</div>
                            <div style="font-size:14px;font-weight:700;color:#3a1a2a;margin-top:4px;letter-spacing:-0.01em;font-family:'Inter Tight',system-ui,sans-serif;">${escaped.mood}</div>
                          </td></tr>
                        </table>
                      </td>
                      <td width="33%" style="padding-left:5px;vertical-align:top;">
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                          style="background:rgba(255,255,255,0.55);border-radius:14px;border:1px solid rgba(255,255,255,0.8);">
                          <tr><td style="padding:12px 14px;">
                            <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#3a1a2a;opacity:0.55;font-weight:600;font-family:'Inter Tight',system-ui,sans-serif;">Fuel</div>
                            <div style="font-size:14px;font-weight:700;color:#3a1a2a;margin-top:4px;letter-spacing:-0.01em;font-family:'Inter Tight',system-ui,sans-serif;">${escaped.fuel}</div>
                          </td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Sign-off -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                    style="margin-top:28px;border-top:1px dashed rgba(58,26,42,0.2);">
                    <tr>
                      <td style="padding-top:20px;">
                        <div style="font-size:11px;color:#3a1a2a;opacity:0.55;font-weight:500;letter-spacing:0.02em;font-family:'Inter Tight',system-ui,sans-serif;">
                          With warm regards,
                        </div>
                        <div style="font-size:17px;font-weight:700;color:#3a1a2a;letter-spacing:-0.015em;margin-top:4px;font-family:'Inter Tight',system-ui,sans-serif;">
                          ${escaped.from}
                        </div>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="margin-top:20px;">
              <tr>
                <td align="center">
                  <span style="font-size:11px;color:#fff;opacity:0.5;font-weight:500;letter-spacing:0.02em;font-family:'Inter Tight',system-ui,sans-serif;">
                    Crafted with AI &#x2726; Design Team
                  </span>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}
