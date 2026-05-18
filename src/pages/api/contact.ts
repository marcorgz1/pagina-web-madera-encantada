import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request, redirect }) => {

try {
    const data = await request.formData();
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    // Honeypot anti-spam: bots fill this hidden field
    if (data.get('website')) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (!name || !email || !message) {
        return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400 }
        );
    }
    const { error } = await resend.emails.send({
        from: `Madera Encantada <${import.meta.env.CONTACT_FROM_EMAIL}>`,
        to: [import.meta.env.CONTACT_TO_EMAIL],
        replyTo: email,
        subject: email,
        html: `<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`
        });
        if (error) {
        console.error('Resend error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to send email' }),
            { status: 500 }
        );
        }
        // return new Response(JSON.stringify({ success: true }), { status: 200 });
        
        // Se usa el código 303 para cambiar la petición de POST a GET cuando se lanza la
        // paǵina de redireccionamiento, evitando que se vuelva a enviar el formulario si el usuario
        // recarga en la página de success
        return redirect('/contact/success', 303);
    } catch (err) {
        console.error(err);
        return new Response(
        JSON.stringify({ error: 'Server error' }),
        { status: 500 }
        );
    }
};

function escapeHtml(str: string) {
    return str
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '');
};
