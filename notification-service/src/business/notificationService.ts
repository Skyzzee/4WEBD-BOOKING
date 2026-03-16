import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const options: SMTPTransport.Options = {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
};

const transporter = nodemailer.createTransport(options);

export const processNotification = async (templateName: string, to: string, data: any) => {
    const builder = EMAIL_TEMPLATES[templateName];
    
    if (!builder) throw new Error(`Template ${templateName} non reconnu.`);

    const { subject, html } = builder(data);

    return await transporter.sendMail({
        from: '"Booking Team" <equipe@booking.com>',
        to,
        subject,
        html,
    });
};

const EMAIL_TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
    WELCOME_EMAIL: () => ({
        subject: 'Bienvenue sur Booking !',
        html: `
            <div style="font-family: sans-serif; background-color: #121212; color: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                <h1 style="color: #2f1db9;">Bienvenue !</h1>

                <p>Merci d'avoir rejoint <strong>Booking</strong>.</p>
                <p>Consulte les prochains événements et achète tes billets directement sur notre plateforme.</p>

                <br /><hr style="border: 0.5px solid #282828;" />
                <p style="font-size: 12px; color: #b3b3b3; text-align: center;">L'équipe Booking</p>
            </div>`
    }),

    VERIFY_EMAIL: (data) => ({
        subject: 'Confirmez votre adresse email',
        html: `
            <div style="font-family: sans-serif; background-color: #121212; color: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                <h1 style="color: #2f1db9;">Confirmez votre email</h1>
                
                <p>Bonjour ${data.firstName},</p><br />
                <p>Merci de vous être inscrit sur <strong>Booking</strong>. Cliquez sur le bouton ci-dessous pour activer votre compte.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:8080/api/auth/verify-email/${data.verificationToken}" 
                    style="display: inline-block; background-color: #2f1db9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                        Confirmer mon email
                    </a>
                </div>

                <p style="font-size: 12px; color: #b3b3b3;">Ce lien expire dans 24h. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
                
                <br /><hr style="border: 0.5px solid #282828;" />
                <p style="font-size: 12px; color: #b3b3b3; text-align: center;">L'équipe Booking</p>
            </div>`
    }),

    ROLE_UPDATED: (data) => ({
        subject: 'Votre rôle a été mis à jour',
        html: `
            <div style="font-family: sans-serif; background-color: #121212; color: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                <h1 style="color: #2f1db9;">Rôle mis à jour</h1>
                <p>Votre rôle sur <strong>Booking</strong> a été modifié.</p>
                <p>Votre nouveau rôle est : <strong>${data.role}</strong></p>
                <br /><hr style="border: 0.5px solid #282828;" />
                <p style="font-size: 12px; color: #b3b3b3; text-align: center;">L'équipe Booking</p>
            </div>`
    }),

    ACCOUNT_DELETED: () => ({
        subject: 'Votre compte a été supprimé',
        html: `
            <div style="font-family: sans-serif; background-color: #121212; color: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                <h1 style="color: #e53935;">Compte supprimé</h1>
                <p>Votre compte <strong>Booking</strong> a été supprimé.</p>
                <p>Si vous pensez qu'il s'agit d'une erreur, contactez notre support.</p>
                <br /><hr style="border: 0.5px solid #282828;" />
                <p style="font-size: 12px; color: #b3b3b3; text-align: center;">L'équipe Booking</p>
            </div>`
    }),

    EVENT_CREATED: (data) => ({
        subject: `Votre événement "${data.title}" a été créé`,
        html: `
            <div style="font-family: sans-serif; background-color: #121212; color: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                <h1 style="color: #2f1db9;">Événement créé ✅</h1>
                <p>Votre événement <strong>${data.title}</strong> a bien été créé.</p>
                <p>Il est actuellement en statut <strong>DRAFT</strong>. Pensez à le publier pour qu'il soit visible par les utilisateurs.</p>
                <br /><hr style="border: 0.5px solid #282828;" />
                <p style="font-size: 12px; color: #b3b3b3; text-align: center;">L'équipe Booking</p>
            </div>`
    }),

    EVENT_UPDATED: (data) => ({
        subject: `Votre événement "${data.title}" a été modifié`,
        html: `
            <div style="font-family: sans-serif; background-color: #121212; color: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                <h1 style="color: #2f1db9;">Événement modifié</h1>
                <p>Votre événement <strong>${data.title}</strong> a bien été mis à jour.</p>
                <br /><hr style="border: 0.5px solid #282828;" />
                <p style="font-size: 12px; color: #b3b3b3; text-align: center;">L'équipe Booking</p>
            </div>`
    }),

    EVENT_STATUS_UPDATED: (data) => ({
        subject: `Statut de "${data.title}" mis à jour`,
        html: `
            <div style="font-family: sans-serif; background-color: #121212; color: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                <h1 style="color: #2f1db9;">Statut mis à jour</h1>
                <p>Le statut de votre événement <strong>${data.title}</strong> a été modifié.</p>
                <p>Nouveau statut : <strong>${data.status}</strong></p>
                <br /><hr style="border: 0.5px solid #282828;" />
                <p style="font-size: 12px; color: #b3b3b3; text-align: center;">L'équipe Booking</p>
            </div>`
    }),

    EVENT_DELETED: (data) => ({
        subject: `Votre événement "${data.title}" a été supprimé`,
        html: `
            <div style="font-family: sans-serif; background-color: #121212; color: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
                <h1 style="color: #e53935;">Événement supprimé</h1>
                <p>Votre événement <strong>${data.title}</strong> a été supprimé.</p>
                <p>Si vous pensez qu'il s'agit d'une erreur, contactez notre support.</p>
                <br /><hr style="border: 0.5px solid #282828;" />
                <p style="font-size: 12px; color: #b3b3b3; text-align: center;">L'équipe Booking</p>
            </div>`
    }),
};