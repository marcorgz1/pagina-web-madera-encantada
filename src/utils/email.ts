import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

interface EmailPayload {
    name: FormDataEntryValue | null;
    email: FormDataEntryValue | null;
    subject?: FormDataEntryValue | null;
    phone?: FormDataEntryValue | null;
    html: string;
};

export async function sendEmail(payload: EmailPayload) {
    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: ['markiiix1@gmail.com'],           // your inbox
        subject: `New message from ${payload.name}`,
        html: `
            <h2>New contact form submission</h2>
            <p><strong>Name:</strong> ${payload.name}</p>
            <p><strong>Email:</strong> ${payload.email}</p>
            <p><strong>Phone:</strong> ${payload.phone ?? '—'}</p>
            <hr />
            <p>${payload.html}</p>
            `,
        replyTo: String(payload.email), // so you can reply directly
    });

    if (error) throw new Error(error.message);
    return data;
};
