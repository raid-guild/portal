type TransactionalEmailAction = {
  href: string
  label: string
}

type RenderTransactionalEmailArgs = {
  action?: TransactionalEmailAction
  eyebrow?: string
  footer?: string
  intro?: string
  preheader?: string
  sections?: string[]
  title: string
}

export const escapeHTML = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const renderTransactionalEmail = ({
  action,
  eyebrow = 'RaidGuild Portal',
  footer = 'If you did not request this email, you can ignore it.',
  intro,
  preheader,
  sections = [],
  title,
}: RenderTransactionalEmailArgs): string => {
  const safePreheader = preheader || title
  const safeSections = sections.filter(Boolean)

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHTML(title)}</title>
  </head>
  <body style="margin:0;background:#090908;color:#f8efd8;font-family:Georgia,'Times New Roman',serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHTML(safePreheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#090908;margin:0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;border:1px solid #4a332c;background:#160c0a;">
            <tr>
              <td style="padding:28px 28px 20px 28px;border-bottom:1px solid #4a332c;">
                <p style="margin:0 0 14px 0;color:#e1b96f;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
                  ${escapeHTML(eyebrow)}
                </p>
                <h1 style="margin:0;color:#fff6df;font-size:34px;line-height:1.08;font-weight:700;">
                  ${escapeHTML(title)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${
                  intro
                    ? `<p style="margin:0 0 18px 0;color:#f8efd8;font-size:16px;line-height:1.65;">${escapeHTML(intro)}</p>`
                    : ''
                }
                ${safeSections
                  .map(
                    (section) =>
                      `<p style="margin:0 0 16px 0;color:#cdbf9d;font-size:14px;line-height:1.65;">${escapeHTML(section)}</p>`,
                  )
                  .join('')}
                ${
                  action
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 20px 0;">
                    <tr>
                      <td style="background:#b2523a;border:1px solid #d28769;">
                        <a href="${escapeHTML(action.href)}" style="display:inline-block;padding:14px 18px;color:#fff6df;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.12em;text-decoration:none;text-transform:uppercase;">
                          ${escapeHTML(action.label)}
                        </a>
                      </td>
                    </tr>
                  </table>`
                    : ''
                }
                ${
                  action
                    ? `<p style="margin:0 0 18px 0;color:#8f8063;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;">
                    If the button does not work, paste this link into your browser:<br />
                    <a href="${escapeHTML(action.href)}" style="color:#e1b96f;word-break:break-all;">${escapeHTML(action.href)}</a>
                  </p>`
                    : ''
                }
                <p style="margin:24px 0 0 0;border-top:1px solid #4a332c;padding-top:18px;color:#8f8063;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;">
                  ${escapeHTML(footer)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
