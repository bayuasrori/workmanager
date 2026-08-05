/**
 * emailNotification.ts
 * ─────────────────────
 * Service terpusat untuk semua email transaksional Papanin.
 *
 * Semua fungsi di sini FIRE-AND-FORGET — error email tidak boleh
 * menggagalkan flow utama (payment webhook, dll). Caller tidak perlu await.
 *
 * Pola pemakaian:
 *   import { emailNotification } from '$lib/server/service/emailNotification';
 *   emailNotification.paymentSucceeded(payment, user).catch(console.error);
 */

import { email, getEmailConfig, paymentSucceeded, aiTopupGranted } from '$lib/server/email';
import type { Payment, User } from '$lib/server/db/schema';

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayName(user: Pick<User, 'username'>): string {
	return user.username;
}

/**
 * Kirim email, tangkap error ke console agar tidak crash caller.
 * Gunakan ini untuk semua fire-and-forget email.
 */
async function safeSend(
	fn: () => Promise<unknown>,
	label: string
): Promise<void> {
	try {
		await fn();
	} catch (err) {
		console.error(`[emailNotification] Gagal kirim email "${label}":`, err);
	}
}

// ── Payment notifications ─────────────────────────────────────────────────────

/**
 * Email konfirmasi pembayaran berhasil (subscription atau topup).
 * Dipanggil dari paymentService.handleWebhookEvent setelah status = succeeded.
 */
export async function notifyPaymentSucceeded(
	payment: Payment,
	user: Pick<User, 'username' | 'email'>
): Promise<void> {
	const cfg = getEmailConfig();
	const content = paymentSucceeded({
		name: displayName(user),
		invoiceNumber: payment.invoiceNumber ?? payment.id,
		description: payment.description ?? 'Pembayaran',
		amount: String(payment.amount),
		currency: payment.currency,
		cfg
	});

	await safeSend(
		() => email.send({ to: user.email, ...content }),
		`payment-succeeded:${payment.id}`
	);
}

/**
 * Email notifikasi kredit AI berhasil ditambah (topup).
 * Dipanggil setelah grantTopupForPayment berhasil.
 */
export async function notifyAiTopupGranted(
	payment: Payment,
	user: Pick<User, 'username' | 'email'>,
	newTopupBalance: number
): Promise<void> {
	const cfg = getEmailConfig();
	const credits = payment.creditsPurchased ?? 0;
	const content = aiTopupGranted({
		name: displayName(user),
		credits,
		balance: newTopupBalance,
		cfg
	});

	await safeSend(
		() => email.send({ to: user.email, ...content }),
		`ai-topup-granted:${payment.id}`
	);
}

/**
 * Email notifikasi pembayaran gagal.
 * Dipanggil ketika webhook status = failed.
 */
export async function notifyPaymentFailed(
	payment: Payment,
	user: Pick<User, 'username' | 'email'>
): Promise<void> {
	const cfg = getEmailConfig();
	const billingUrl = `${cfg.appUrl}/billing`;
	const formatted = (() => {
		try {
			return new Intl.NumberFormat('id-ID', {
				style: 'currency',
				currency: payment.currency,
				maximumFractionDigits: 0
			}).format(Number(payment.amount));
		} catch {
			return `${payment.currency} ${payment.amount}`;
		}
	})();

	await safeSend(
		() =>
			email.send({
				to: user.email,
				subject: `Pembayaran gagal — ${payment.invoiceNumber ?? payment.id}`,
				text: `Halo ${displayName(user)}, pembayaran ${payment.description ?? ''} (${formatted}) gagal diproses. Coba lagi di ${billingUrl}.`,
				html: `<!doctype html><html><body style="font-family:ui-sans-serif,system-ui,Arial,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#064e3b;color:#ecfdf5;padding:20px 24px"><strong>Papanin</strong></div>
    <div style="padding:24px">
      <h1 style="font-size:18px;margin:0 0 12px;color:#dc2626">Pembayaran Gagal</h1>
      <p>Halo <strong>${displayName(user)}</strong>,</p>
      <p>Pembayaran untuk <strong>${payment.description ?? 'Langganan'}</strong> sebesar <strong>${formatted}</strong> gagal diproses.</p>
      ${payment.errorMessage ? `<p style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;font-size:13px;color:#b91c1c">${payment.errorMessage}</p>` : ''}
      <p>Silakan coba lagi atau hubungi kami jika masalah berlanjut.</p>
      <p><a href="${billingUrl}" style="display:inline-block;background:#064e3b;color:#ecfdf5;padding:10px 16px;border-radius:8px;text-decoration:none">Coba Lagi di Billing</a></p>
      ${payment.invoiceNumber ? `<p style="color:#64748b;font-size:13px">Invoice: <code>${payment.invoiceNumber}</code></p>` : ''}
    </div>
    <div style="padding:12px 24px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0">Email ini dikirim oleh Papanin.</div>
  </div></body></html>`
			}),
		`payment-failed:${payment.id}`
	);
}

/**
 * Email konfirmasi pembayaran sedang diproses (status pending → user selesai checkout).
 * Dipanggil sesaat setelah createIntent berhasil membuat payment link.
 */
export async function notifyPaymentPending(
	payment: Payment,
	user: Pick<User, 'username' | 'email'>,
	paymentLinkUrl: string
): Promise<void> {
	const cfg = getEmailConfig();
	const formatted = (() => {
		try {
			return new Intl.NumberFormat('id-ID', {
				style: 'currency',
				currency: payment.currency,
				maximumFractionDigits: 0
			}).format(Number(payment.amount));
		} catch {
			return `${payment.currency} ${payment.amount}`;
		}
	})();

	await safeSend(
		() =>
			email.send({
				to: user.email,
				subject: `Selesaikan pembayaran — ${payment.description ?? 'Papanin'}`,
				text: `Halo ${displayName(user)}, selesaikan pembayaran ${payment.description ?? ''} (${formatted}) di: ${paymentLinkUrl}`,
				html: `<!doctype html><html><body style="font-family:ui-sans-serif,system-ui,Arial,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#064e3b;color:#ecfdf5;padding:20px 24px"><strong>Papanin</strong></div>
    <div style="padding:24px">
      <h1 style="font-size:18px;margin:0 0 12px">Selesaikan Pembayaran</h1>
      <p>Halo <strong>${displayName(user)}</strong>,</p>
      <p>Pesanan <strong>${payment.description ?? 'Langganan Papanin'}</strong> sebesar <strong>${formatted}</strong> sedang menunggu pembayaran.</p>
      <p><a href="${paymentLinkUrl}" style="display:inline-block;background:#064e3b;color:#ecfdf5;padding:10px 16px;border-radius:8px;text-decoration:none">Bayar Sekarang</a></p>
      ${payment.invoiceNumber ? `<p style="color:#64748b;font-size:13px">Invoice: <code>${payment.invoiceNumber}</code></p>` : ''}
      <p style="color:#94a3b8;font-size:12px">Link pembayaran berlaku sementara. Jika sudah membayar, abaikan email ini.</p>
    </div>
    <div style="padding:12px 24px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0">Email ini dikirim oleh Papanin.</div>
  </div></body></html>`
			}),
		`payment-pending:${payment.id}`
	);
}

// ── Namespace export ──────────────────────────────────────────────────────────

export const emailNotification = {
	paymentSucceeded: notifyPaymentSucceeded,
	aiTopupGranted: notifyAiTopupGranted,
	paymentFailed: notifyPaymentFailed,
	paymentPending: notifyPaymentPending
};
