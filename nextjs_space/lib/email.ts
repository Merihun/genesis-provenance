import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. Email functionality will not work.');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const DEFAULT_FROM = process.env.EMAIL_FROM || 'Genesis Provenance <noreply@genesisprovenance.com>';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  if (!resend) {
    console.error('Resend client not initialized. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: options.from || DEFAULT_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Team invitation email template
export function generateInvitationEmail({
  inviterName,
  inviterEmail,
  organizationName,
  role,
  acceptUrl,
  expiresAt,
}: {
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date;
}) {
  const roleDescription = {
    owner: 'Owner - Full administrative access',
    admin: 'Admin - Manage team members and settings',
    editor: 'Editor - Create and edit assets',
    viewer: 'Viewer - View-only access',
  }[role] || role;

  const expiresDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(expiresAt);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; font-family: 'Playfair Display', serif;">Genesis Provenance</h1>
              <p style="margin: 8px 0 0; color: #e5e7eb; font-size: 14px;">AI-Powered Provenance Vault</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 24px; font-weight: 600;">You've Been Invited!</h2>
              
              <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> (${inviterEmail}) has invited you to join <strong>${organizationName}</strong> on Genesis Provenance.
              </p>
              
              <div style="background-color: #f9fafb; border-left: 4px solid #d4af37; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px; color: #1f2937; font-size: 14px; font-weight: 600;">Your Role:</p>
                <p style="margin: 0; color: #4b5563; font-size: 14px;">${roleDescription}</p>
              </div>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                With Genesis Provenance, you'll be able to:
              </p>
              
              <ul style="margin: 0 0 24px; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                <li>Securely document and track luxury assets</li>
                <li>Generate certificates of authenticity</li>
                <li>Maintain comprehensive provenance records</li>
                <li>Collaborate with your team</li>
              </ul>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${acceptUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1e40af; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0; color: #3b82f6; font-size: 13px; word-break: break-all;">
                ${acceptUrl}
              </p>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                  <strong>Note:</strong> This invitation expires on ${expiresDate}.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                Genesis Provenance - Luxury Asset Authentication & Documentation
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Genesis Provenance. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
You've Been Invited to Genesis Provenance!

${inviterName} (${inviterEmail}) has invited you to join ${organizationName} on Genesis Provenance.

Your Role: ${roleDescription}

With Genesis Provenance, you'll be able to:
- Securely document and track luxury assets
- Generate certificates of authenticity
- Maintain comprehensive provenance records
- Collaborate with your team

Accept your invitation by visiting:
${acceptUrl}

Note: This invitation expires on ${expiresDate}.

---
Genesis Provenance - Luxury Asset Authentication & Documentation
© ${new Date().getFullYear()} Genesis Provenance. All rights reserved.
  `;

  return { html, text };
}

// Helper function to send team invitation
export async function sendTeamInvitation({
  to,
  inviterName,
  inviterEmail,
  organizationName,
  role,
  inviteToken,
  expiresAt,
}: {
  to: string;
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  role: string;
  inviteToken: string;
  expiresAt: Date;
}) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const acceptUrl = `${baseUrl}/team/accept/${inviteToken}`;

  const { html, text } = generateInvitationEmail({
    inviterName,
    inviterEmail,
    organizationName,
    role,
    acceptUrl,
    expiresAt,
  });

  return sendEmail({
    to,
    subject: `You've been invited to join ${organizationName} on Genesis Provenance`,
    html,
    text,
  });
}
