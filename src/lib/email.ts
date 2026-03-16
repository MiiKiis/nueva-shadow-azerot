import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const defaultFrom = process.env.RESEND_FROM || 'Shadow Azeroth <onboarding@resend.dev>';
const pinTemplateId = process.env.RESEND_TEMPLATE_PIN_ID || '7d7e25cd-f80f-4823-a318-c198536244bd';

function canSendEmail() {
  return Boolean(resend);
}

export async function sendWelcomeEmail(params: {
  email: string;
  username: string;
}) {
  if (!canSendEmail()) return { skipped: true };

  await resend!.emails.send({
    from: defaultFrom,
    to: params.email,
    subject: 'Bienvenido a Shadow Azeroth',
    html: `
      <div style="font-family:Arial,sans-serif;background:#090812;color:#f8fafc;padding:24px;line-height:1.6;">
        <div style="max-width:640px;margin:0 auto;background:#120b1f;border:1px solid rgba(168,85,247,.35);border-radius:18px;overflow:hidden;">
          <div style="padding:24px 24px 12px;background:linear-gradient(90deg,#28103d,#101828);">
            <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;">Bienvenido a Shadow Azeroth</h1>
            <p style="margin:8px 0 0;color:#cbd5e1;">Tu cuenta ha sido creada correctamente.</p>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;">Hola <strong>${params.username}</strong>,</p>
            <p style="margin:0 0 12px;">Ya puedes iniciar sesion en la web y acceder a tu panel, armoria, tienda y funciones de cuenta.</p>
            <p style="margin:0 0 12px;">Recuerda mantener segura tu contraseña y tu PIN de 4 digitos.</p>
            <p style="margin:16px 0 0;color:#67e8f9;font-weight:700;">Lok'tar ogar.</p>
          </div>
        </div>
      </div>
    `,
  });

  return { skipped: false };
}

export async function sendPasswordChangedEmail(params: {
  email: string;
  username: string;
}) {
  if (!canSendEmail()) return { skipped: true };

  await resend!.emails.send({
    from: defaultFrom,
    to: params.email,
    subject: 'Cambio de contraseña en Shadow Azeroth',
    html: `
      <div style="font-family:Arial,sans-serif;background:#090812;color:#f8fafc;padding:24px;line-height:1.6;">
        <div style="max-width:640px;margin:0 auto;background:#120b1f;border:1px solid rgba(34,211,238,.35);border-radius:18px;overflow:hidden;">
          <div style="padding:24px 24px 12px;background:linear-gradient(90deg,#06263d,#101828);">
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;">Tu contraseña fue actualizada</h1>
            <p style="margin:8px 0 0;color:#cbd5e1;">Notificacion de seguridad de cuenta.</p>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;">Hola <strong>${params.username}</strong>,</p>
            <p style="margin:0 0 12px;">Te confirmamos que la contraseña de tu cuenta fue cambiada correctamente.</p>
            <p style="margin:0 0 12px;">Si no realizaste este cambio, debes revisar tu acceso inmediatamente.</p>
            <p style="margin:16px 0 0;color:#67e8f9;font-weight:700;">Shadow Azeroth Security</p>
          </div>
        </div>
      </div>
    `,
  });

  return { skipped: false };
}

/**
 * Envia el correo de confirmacion con el PIN de seguridad del usuario.
 */
export async function sendPinReminderEmail(toEmail: string, accountName: string, pinCode: string) {
  if (!canSendEmail()) return { skipped: true };

  let htmlContent = '';

  try {
    const templateResponse: any = await resend!.templates.get(pinTemplateId);
    const templateHtml = String(templateResponse?.data?.html || '').trim();
    if (templateHtml) {
      htmlContent = templateHtml;
    }
  } catch (templateError) {
    console.warn('No se pudo obtener plantilla de Resend, se usara fallback local:', templateError);
  }

  if (!htmlContent) {
    const templatePath = path.join(process.cwd(), 'shadow-azeroth-email.html');
    htmlContent = fs.readFileSync(templatePath, 'utf-8');
  }

  htmlContent = htmlContent
    .replace(/{{ACCOUNT_NAME}}/g, accountName)
    .replace(/{{PIN_CODE}}/g, pinCode);

  const { data, error } = await resend!.emails.send({
    from: process.env.RESEND_FROM || 'Shadow Azeroth <noreply@shadowazeroth.com>',
    to: [toEmail],
    subject: `Tu PIN de seguridad, ${accountName}`,
    html: htmlContent,
  });

  if (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }

  console.log(`Email enviado a ${toEmail} | ID: ${data?.id || 'sin-id'}`);
  return data;
}
