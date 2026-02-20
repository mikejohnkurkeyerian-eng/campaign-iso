import nodemailer from 'nodemailer';

const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: (parseInt(process.env.SMTP_PORT || '587') === 465),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    logger: false,
    debug: false,
    family: 4 as const,
};

const isConfigured = smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass;

if (!isConfigured) {
    console.warn('[Email] SMTP not configured — emails will be logged to console (Mock Mode).');
}

const transporter = nodemailer.createTransport(smtpConfig as any);

export interface EmailAttachment {
    content: string;
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
    contentId?: string;
}

export interface EmailPayload {
    to: string;
    from?: string;
    senderName?: string;
    replyTo?: string;
    subject: string;
    html: string;
    attachments?: EmailAttachment[];
}

export const sendEmail = async (payload: EmailPayload) => {
    if (!isConfigured) {
        console.log('--- MOCK EMAIL ---');
        console.log(`To: ${payload.to} | Subject: ${payload.subject}`);
        console.log('------------------');
        return { success: true, mock: true };
    }

    const SYSTEM_SENDER = process.env.EMAIL_FROM_ADDRESS || 'campaigns@yourdomain.com';
    const fromHeader = payload.senderName
        ? `"${payload.senderName}" <${SYSTEM_SENDER}>`
        : SYSTEM_SENDER;

    const mailOptions = {
        from: fromHeader,
        to: payload.to,
        replyTo: payload.replyTo,
        subject: payload.subject,
        html: payload.html,
        attachments: payload.attachments?.map(a => ({
            filename: a.filename,
            content: Buffer.from(a.content, 'base64'),
            contentType: a.type,
            cid: a.contentId
        }))
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Sent: ${info.messageId}`);
        return { success: true, mock: false, messageId: info.messageId, response: info.response };
    } catch (error: any) {
        console.error(`[Email] Primary failed (${error.code}). Trying failover...`);
        try {
            const altPort = smtpConfig.port === 465 ? 587 : 465;
            const failoverTransporter = nodemailer.createTransport({
                ...smtpConfig,
                port: altPort,
                secure: altPort === 465,
            } as any);
            const info = await failoverTransporter.sendMail(mailOptions);
            console.log(`[Email] Sent (failover): ${info.messageId}`);
            return { success: true, mock: false, messageId: info.messageId, response: info.response };
        } catch (failoverError: any) {
            console.error('[Email] Failover also failed:', failoverError);
            return { success: false, error: failoverError.message };
        }
    }
};
