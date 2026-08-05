import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { SmtpEmailProvider } from '$lib/server/email/smtp';
import { env } from '$env/dynamic/private';

/** Baca config SMTP dari env untuk ditampilkan di form (tanpa password). */
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user?.isAdmin) throw redirect(303, '/');

	return {
		smtp: {
			host: env.PAPANIN_EMAIL_SMTP_HOST ?? '',
			port: Number(env.PAPANIN_EMAIL_SMTP_PORT ?? 587),
			user: env.PAPANIN_EMAIL_SMTP_USER ?? '',
			from: env.PAPANIN_EMAIL_FROM ?? '',
			fromName: env.PAPANIN_EMAIL_FROM_NAME ?? 'Papanin',
			provider: (env.PAPANIN_EMAIL_PROVIDER || '').toLowerCase() || 'log',
			configured: Boolean(
				env.PAPANIN_EMAIL_SMTP_HOST &&
					env.PAPANIN_EMAIL_SMTP_USER &&
					env.PAPANIN_EMAIL_SMTP_PASS
			)
		}
	};
};

export const actions: Actions = {
	/** Kirim email test ke alamat yang diisi admin. */
	send_test: async ({ request }) => {
		const data = await request.formData();
		const to = (data.get('to') as string | null)?.trim();
		const subject = (data.get('subject') as string | null)?.trim() || 'Test Email dari Papanin';
		const body = (data.get('body') as string | null)?.trim() || 'Ini adalah email test dari Papanin Admin.';

		// Bisa override SMTP per-test (opsional — kalau kosong pakai env)
		const host = (data.get('host') as string | null)?.trim() || env.PAPANIN_EMAIL_SMTP_HOST;
		const port = Number(data.get('port') || env.PAPANIN_EMAIL_SMTP_PORT || 587);
		const user = (data.get('user') as string | null)?.trim() || env.PAPANIN_EMAIL_SMTP_USER;
		const pass = (data.get('pass') as string | null)?.trim() || env.PAPANIN_EMAIL_SMTP_PASS;
		const fromAddr = (data.get('from') as string | null)?.trim() || env.PAPANIN_EMAIL_FROM || 'noreply@papanin.app';
		const fromName = (data.get('fromName') as string | null)?.trim() || env.PAPANIN_EMAIL_FROM_NAME || 'Papanin';

		if (!to) {
			return fail(400, { error: 'Alamat email tujuan wajib diisi.', elapsed: 0, host, port });
		}

		if (!host || !user || !pass) {
			return fail(400, {
				error: 'Konfigurasi SMTP tidak lengkap. Set PAPANIN_EMAIL_SMTP_HOST, _USER, _PASS di .env atau isi form override.',
				elapsed: 0,
				host,
				port
			});
		}

		const started = Date.now();

		try {
			const provider = new SmtpEmailProvider({
				host,
				port,
				secure: port === 465,
				user,
				pass,
				from: { address: fromAddr, name: fromName }
			});

			const result = await provider.send({
				to,
				subject,
				text: body,
				html: `<div style="font-family:sans-serif;max-width:520px">
					<h2 style="color:#6366f1">📧 ${subject}</h2>
					<p>${body.replace(/\n/g, '<br>')}</p>
					<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
					<p style="color:#9ca3af;font-size:12px">
						Dikirim via Papanin Admin SMTP Test &bull; ${new Date().toLocaleString('id-ID')}
					</p>
				</div>`
			});

			const elapsed = Date.now() - started;

			return {
				success: true,
				messageId: result.messageId,
				to,
				elapsed,
				host,
				port
			};
		} catch (err) {
			const elapsed = Date.now() - started;
			const message = err instanceof Error ? err.message : String(err);
			return fail(500, { error: message, elapsed, host, port });
		}
	},

	/** Tes koneksi SMTP tanpa kirim email (SMTP STARTTLS handshake saja). */
	verify_connection: async ({ request }) => {
		const data = await request.formData();
		const host = (data.get('host') as string | null)?.trim() || env.PAPANIN_EMAIL_SMTP_HOST;
		const port = Number(data.get('port') || env.PAPANIN_EMAIL_SMTP_PORT || 587);
		const user = (data.get('user') as string | null)?.trim() || env.PAPANIN_EMAIL_SMTP_USER;
		const pass = (data.get('pass') as string | null)?.trim() || env.PAPANIN_EMAIL_SMTP_PASS;

		if (!host || !user || !pass) {
			return fail(400, {
				error: 'Host, user, dan password wajib diisi untuk test koneksi.',
				elapsed: 0,
				host,
				port
			});
		}

		const started = Date.now();

		try {
			// Pakai nodemailer verify() untuk cek handshake tanpa kirim email
			const nodemailer = await import('nodemailer');
			const transporter = nodemailer.default.createTransport({
				host,
				port,
				secure: port === 465,
				auth: { user, pass }
			});
			await transporter.verify();
			transporter.close();

			const elapsed = Date.now() - started;
			return { verified: true, elapsed, host, port };
		} catch (err) {
			const elapsed = Date.now() - started;
			const message = err instanceof Error ? err.message : String(err);
			return fail(500, { error: message, elapsed, host, port });
		}
	}
};
