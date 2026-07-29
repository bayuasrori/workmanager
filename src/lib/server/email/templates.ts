import type { EmailConfig } from './types';

/** Wrap body HTML in a consistent branded shell. */
function shell(title: string, bodyHtml: string): string {
	return `<!doctype html><html><body style="font-family:ui-sans-serif,system-ui,Arial,sans-serif;background:#f8fafc;margin:0;padding:24px;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#064e3b;color:#ecfdf5;padding:20px 24px"><strong>Papanin</strong></div>
    <div style="padding:24px"><h1 style="font-size:18px;margin:0 0 12px">${title}</h1>${bodyHtml}</div>
    <div style="padding:12px 24px;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0">Email ini dikirim oleh Papanin.</div>
  </div></body></html>`;
}

export interface EmailContent {
	subject: string;
	html: string;
	text: string;
}

export function welcome(name: string, cfg: EmailConfig): EmailContent {
	const link = `${cfg.appUrl}/dashboard`;
	return {
		subject: 'Selamat datang di Papanin!',
		html: shell(
			'Selamat datang!',
			`<p>Halo <strong>${name}</strong>,</p><p>Akun Papanin kamu sudah aktif. Kamu mendapat <strong>14 hari Pro Trial</strong> secara gratis — coba semua fitur pro.</p><p><a href="${link}" style="display:inline-block;background:#064e3b;color:#ecfdf5;padding:10px 16px;border-radius:8px;text-decoration:none">Mulai sekarang</a></p>`
		),
		text: `Halo ${name}, akun Papanin kamu sudah aktif + 14 hari Pro Trial gratis. Mulai: ${link}`
	};
}

export function trialStarted(name: string, days: number, cfg: EmailConfig): EmailContent {
	const link = `${cfg.appUrl}/billing`;
	return {
		subject: `Trial Pro ${days} hari dimulai`,
		html: shell(
			'Trial Pro aktif',
			`<p>Halo <strong>${name}</strong>,</p><p>Trial Pro <strong>${days} hari</strong> sudah aktif. Fitur pro bisa dipakai, tapi kuota AI dibatasi ${20} kali selama trial.</p><p><a href="${link}" style="color:#064e3b">Lihat detail di Billing</a></p>`
		),
		text: `Trial Pro ${days} hari aktif. AI dibatasi 20x selama trial. Detail: ${link}`
	};
}

export function paymentSucceeded(input: {
	name: string;
	invoiceNumber: string;
	description: string;
	amount: string;
	currency: string;
	cfg: EmailConfig;
}): EmailContent {
	const { name, invoiceNumber, description, amount, currency, cfg } = input;
	const link = `${cfg.appUrl}/billing/invoice/${invoiceNumber}`;
	const formatted = new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency,
		maximumFractionDigits: 0
	}).format(Number(amount));
	return {
		subject: `Pembayaran berhasil — ${invoiceNumber}`,
		html: shell(
			'Pembayaran berhasil',
			`<p>Terima kasih <strong>${name}</strong>!</p><p>Pembayaran untuk <strong>${description}</strong> sebesar <strong>${formatted}</strong> telah kami terima.</p><p>Invoice: <code>${invoiceNumber}</code><br/><a href="${link}" style="color:#064e3b">Lihat invoice</a></p>`
		),
		text: `Pembayaran ${description} (${formatted}) berhasil. Invoice ${invoiceNumber}: ${link}`
	};
}

export function aiTopupGranted(input: {
	name: string;
	credits: number;
	balance: number;
	cfg: EmailConfig;
}): EmailContent {
	const { name, credits, balance, cfg } = input;
	const link = `${cfg.appUrl}/billing`;
	return {
		subject: `${credits} kredit AI bertambah`,
		html: shell(
			'Kredit AI bertambah',
			`<p>Halo <strong>${name}</strong>,</p><p><strong>${credits}</strong> kredit AI sudah masuk. Saldo topup sekarang: <strong>${balance}</strong>.</p><p><a href="${link}" style="color:#064e3b">Kelola di Billing</a></p>`
		),
		text: `${credits} kredit AI masuk. Saldo topup: ${balance}. ${link}`
	};
}
