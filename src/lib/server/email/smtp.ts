import nodemailer from 'nodemailer';
import type { EmailAddress, EmailInput, EmailProvider, EmailResult } from './types';

export interface SmtpConfig {
	host: string;
	port: number;
	secure: boolean; // true for 465, false for 587 (STARTTLS)
	user: string;
	pass: string;
	from: EmailAddress;
}

/**
 * SMTP provider backed by nodemailer. Works with any SMTP host
 * (Gmail, Amazon SES, Brevo/Sendinblue, Mailgun, Postmark, Mailtrap, etc.)
 * — switching SMTP vendor is just changing host/port/user/pass in env.
 */
export class SmtpEmailProvider implements EmailProvider {
	readonly name = 'smtp';
	private transporter: nodemailer.Transporter;

	constructor(config: SmtpConfig) {
		this.transporter = nodemailer.createTransport({
			host: config.host,
			port: config.port,
			secure: config.secure,
			auth: { user: config.user, pass: config.pass }
		});
		this.from = config.from;
	}

	from: EmailAddress;

	private formatAddress(a: EmailAddress): string {
		return a.name ? `${a.name} <${a.address}>` : a.address;
	}

	async send(input: EmailInput): Promise<EmailResult> {
		const info = await this.transporter.sendMail({
			from: this.formatAddress(input.from ?? this.from),
			to: typeof input.to === 'string' ? input.to : this.recipients(input.to),
			subject: input.subject,
			text: input.text,
			html: input.html,
			replyTo: input.replyTo,
			headers: input.headers
		});
		return { messageId: info.messageId, provider: this.name, raw: info };
	}

	private recipients(to: string | EmailAddress | (string | EmailAddress)[]): string {
		const list = Array.isArray(to) ? to : [to];
		return list
			.map((entry) => (typeof entry === 'string' ? entry : this.formatAddress(entry)))
			.join(', ');
	}
}
