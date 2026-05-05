import type { APIRoute } from 'astro'
import nodemailer from 'nodemailer'

export const POST: APIRoute = async ({ request }) => {
    // Obtener datos del formulario de contacto
    const data = await request.formData()
    // Formatear cada uno de los datos obtenidos
    const name = data.get('full-name')?.toString().trim()
    const phone = data.get('phone-number')?.toString().trim() || 'No proporcionado'
    const email = data.get('email')?.toString().trim()
    const message = data.get('message')?.toString().trim()

    // Validar que todos los campos obligatorios no estén vacíos
    if (!name || !email || !message) {
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Faltan campos obligatorios.',
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: import.meta.env.EMAIL_USER,
            pass: import.meta.env.EMAIL_PASS,
        },
    })

    try {
        await transporter.sendMail({
            from: `"${name}" <${import.meta.env.EMAIL_USER}>`,
            replyTo: email,
            to: import.meta.env.EMAIL_TO,
            subject: `Nuevo mensaje de contacto de ${name}`,
            html: `
                <h2>Nuevo mensaje de contacto</h2>
                <p><strong>Nombre:</strong> ${name}</p>
                <p><strong>Teléfono:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <hr />
                <p><strong>Mensaje:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        })

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error sending email:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Error al enviar el mensaje.',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
