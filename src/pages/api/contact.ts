import type { APIRoute } from 'astro';
// import { Resend } from 'resend'
import nodemailer from "nodemailer";

// ── Types ─────────────────────────────────────────────────────────
interface ContactPayload {
    name: string
    phone?: string
    email: string
    message: string
}

// ── Validation helpers ────────────────────────────────────────────
function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitize(str: string): string {
    return str.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Email HTML template ───────────────────────────────────────────
function buildHtml({ name, phone, email, message }: ContactPayload): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
        <head><meta charset="utf-8"><title>Nuevo mensaje de contacto</title></head>
        <body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#059669;border-bottom:2px solid #d1fae5;padding-bottom:8px">
            📬 Nuevo mensaje de contacto
            </h2>
            <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr>
                <td style="padding:8px 12px;background:#f0fdf4;font-weight:600;width:130px;border-radius:4px 0 0 4px">Nombre</td>
                <td style="padding:8px 12px;background:#f9fafb">${name}</td>
            </tr>
            <tr>
                <td style="padding:8px 12px;background:#f0fdf4;font-weight:600">Email</td>
                <td style="padding:8px 12px;background:#f9fafb">
                <a href="mailto:${email}" style="color:#059669">${email}</a>
                </td>
            </tr>
            ${
                phone
                    ? `<tr>
                <td style="padding:8px 12px;background:#f0fdf4;font-weight:600">Teléfono</td>
                <td style="padding:8px 12px;background:#f9fafb">${phone}</td>
                </tr>`
                    : ''
            }
            <tr>
                <td style="padding:8px 12px;background:#f0fdf4;font-weight:600;vertical-align:top">Mensaje</td>
                <td style="padding:8px 12px;background:#f9fafb;white-space:pre-wrap">${message}</td>
            </tr>
            </table>
            <p style="margin-top:24px;font-size:12px;color:#6b7280">
            Enviado a través del formulario de contacto de tu sitio web.
            </p>
        </body>
    </html>`
}

// ── Main handler ──────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
    // 1. Parse body (supports JSON and multipart/form-data)
    let raw: Record<string, string> = {}
    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
        raw = await request.json()
    } else {
        const formData = await request.formData()
        for (const [key, value] of formData.entries()) {
            raw[key] = value.toString()
        }
    }

    // 2. Validate required fields
    const errors: string[] = []
    if (!raw.name?.trim()) errors.push('El nombre es obligatorio.')
    if (!raw.email?.trim()) errors.push('El correo es obligatorio.')
    else if (!isValidEmail(raw.email)) errors.push('El correo no es válido.')
    if (!raw.message?.trim()) errors.push('El mensaje es obligatorio.')

    if (errors.length > 0) {
        return new Response(JSON.stringify({ ok: false, errors }), {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    // 3. Sanitize
    const payload: ContactPayload = {
        name: sanitize(raw.name),
        email: sanitize(raw.email),
        phone: raw.phone ? sanitize(raw.phone) : undefined,
        message: sanitize(raw.message),
    }

// 4. Send email ── Nodemailer / SMTP ──────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: import.meta.env.SMTP_HOST,
    port: Number(import.meta.env.SMTP_PORT),
    secure: Number(import.meta.env.SMTP_PORT) === 465,
    auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASS,
    },
});

await transporter.sendMail({
    from: `"Tu Sitio Web" <${import.meta.env.CONTACT_FROM_EMAIL}>`,
    to: import.meta.env.CONTACT_TO_EMAIL,
    replyTo: payload.email,
    subject: `Nuevo mensaje de ${payload.name}`,
    html: buildHtml(payload),
});

    return new Response(
        JSON.stringify({ ok: true, message: 'Mensaje enviado correctamente.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
}

// Block every method except POST
export const GET: APIRoute = () =>
    new Response('Method not allowed', { status: 405 })
