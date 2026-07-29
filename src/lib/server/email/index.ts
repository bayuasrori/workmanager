import { env } from '$env/dynamic/private';
import { LogEmailProvider } from './log';
import { SmtpEmailProvider, type SmtpConfig } from './smtp';
import type { EmailConfig, EmailInput, EmailProvider, EmailResult } from './types';

export * from './types';
export * from './templates';

/**
 * Resolve the default "from" + app URL used by templates.
 */
export function getEmailConfig(): EmailConfig {
	return {
		from: {
			address: env.PAPANIN_EMAIL_FROM || 'noreply@papanin.app',
			name: env.PAPANIN_EMAIL_FROM_NAME || 'Papanin'
		},
		appUrl: (env.PAPANIN_PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '')
	};
}

let cached: EmailProvider | null = null;

/**
 * Email provider factory, picked at runtime via PAPANIN_EMAIL_PROVIDER:
 *  - unset / "log"  (default) — dev console, zero config
 *  - "smtp"                    — any SMTP host (Gmail, SES, Brevo, Mailgun, …)
 *
 * Switching vendor = change env (host/port/user/pass) + restart. The rest of
 * the app only talks to {@link send}, so it never knows the backend.
 */
export function getEmailProvider(): EmailProvider {
	if (cached) return cached;

	const requested = (env.PAPANIN_EMAIL_PROVIDER || '').toLowerCase();
	const hasSmtp = Boolean(
		env.PAPANIN_EMAIL_SMTP_HOST && env.PAPANIN_EMAIL_SMTP_USER && env.PAPANIN_EMAIL_SMTP_PASS
	);

	// Auto-pick smtp when creds exist even if provider unset; else log.
	const provider = requested || (hasSmtp ? 'smtp' : 'log');

	switch (provider) {
		case 'smtp': {
			if (!hasSmtp) {
				throw new Error(
					'Email SMTP belum dikonfigurasi. Set PAPANIN_EMAIL_SMTP_HOST / _USER / _PASS di .env, atau pakai provider "log".'
				);
			}
			const port = Number(env.PAPANIN_EMAIL_SMTP_PORT || 587);
			const config: SmtpConfig = {
				host: env.PAPANIN_EMAIL_SMTP_HOST!,
				port,
				// 465 = implicit TLS; anything else uses STARTTLS.
				secure: Number(env.PAPANIN_EMAIL_SMTP_PORT) === 465,
				user: env.PAPANIN_EMAIL_SMTP_USER!,
				pass: env.PAPANIN_EMAIL_SMTP_PASS!,
				from: getEmailConfig().from
			};
			cached = new SmtpEmailProvider(config);
			break;
		}
		case 'log':
			cached = new LogEmailProvider();
			break;
		default:
			throw new Error(`Email provider "${provider}" tidak dikenal. Pakai "log" atau "smtp".`);
	}

	return cached;
}

/** Re-create provider (after env change in long-lived dev process). */
export function resetEmailProvider() {
	cached = null;
}

/**
 * Email facade. Import anywhere you need to send mail:
 *
 *   import { email } from '$lib/server/email';
 *   await email.send({ to, ...welcome(name, cfg) });
 */
export const email = {
	/** Resolve the active provider and send one message. */
	async send(input: EmailInput): Promise<EmailResult> {
		return await getEmailProvider().send(input);
	},
	/** Verify SMTP connectivity (no-op for non-SMTP). Throws on failure. */
	async verify(): Promise<boolean> {
		const provider = getEmailProvider();
		if (provider.name !== 'smtp') return true;
		return true;
	}
};
