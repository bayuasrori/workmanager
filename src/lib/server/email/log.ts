import type { EmailInput, EmailProvider, EmailResult } from './types';

/**
 * Dev provider: renders the email to the server log instead of sending it.
 * Zero config, zero network — use while SMTP creds aren't set up yet.
 * Selected automatically when PAPANIN_EMAIL_PROVIDER is unset or "log".
 */
export class LogEmailProvider implements EmailProvider {
	readonly name = 'log';

	async send(input: EmailInput): Promise<EmailResult> {
		const to = typeof input.to === 'string' ? input.to : JSON.stringify(input.to);
		console.log(
			`\n━━━ EMAIL (log provider, not actually sent) ━━━\n` +
				`To: ${to}\n` +
				`Subject: ${input.subject}\n` +
				`─────────────────────────────────────────────\n` +
				`${input.text ?? '(no plain text; html only)'}\n` +
				`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
		);
		return {
			messageId: `<log-${Date.now()}@papanin.local>`,
			provider: this.name,
			raw: input
		};
	}
}
