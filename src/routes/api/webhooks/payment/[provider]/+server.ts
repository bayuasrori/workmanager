import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { paymentGatewayService } from '$lib/server/service/paymentGateway';
import { paymentService } from '$lib/server/service/payment';
import { getProviderForGateway } from '$lib/server/payment';
import type { PaymentProviderName, WebhookHeaders } from '$lib/server/payment/types';

const KNOWN_PROVIDERS = new Set<string>([
	'sumopod',
	'stripe',
	'paypal',
	'adyen',
	'razorpay',
	'manual',
	'custom'
]);

// ── Rate limiter (in-memory, per IP) ─────────────────────────────────────────
// Simple sliding-window counter: 30 req / 60 s per IP.
// Cukup untuk single-instance SvelteKit; kalau multi-instance pakai Redis.
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const ipHits = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const entry = ipHits.get(ip);

	if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
		// Baru atau window sudah expired — reset counter
		ipHits.set(ip, { count: 1, windowStart: now });
		return false;
	}

	entry.count += 1;
	if (entry.count > RATE_LIMIT) {
		return true;
	}
	return false;
}

// Bersihkan entries lama tiap 5 menit biar Map tidak tumbuh selamanya
setInterval(() => {
	const cutoff = Date.now() - RATE_WINDOW_MS;
	for (const [key, val] of ipHits) {
		if (val.windowStart < cutoff) ipHits.delete(key);
	}
}, 5 * 60_000);

export const GET: RequestHandler = () => json({ ok: true });

export const POST: RequestHandler = async ({ params, request }) => {
	// Rate limit sebelum operasi apapun, termasuk DB lookup
	const clientIp =
		request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
		request.headers.get('x-real-ip') ??
		'unknown';
	if (isRateLimited(clientIp)) {
		return json({ error: 'too many requests' }, { status: 429 });
	}

	const providerName = params.provider;
	if (!KNOWN_PROVIDERS.has(providerName)) {
		return json({ error: 'unknown provider' }, { status: 404 });
	}

	const gateway = await paymentGatewayService.getByProvider(providerName as PaymentProviderName);
	if (!gateway || gateway.status === 'inactive') {
		return json({ error: 'gateway not configured' }, { status: 404 });
	}

	const provider = getProviderForGateway(gateway);
	if (!provider) {
		return json({ error: 'provider not implemented' }, { status: 501 });
	}

	// Raw body is mandatory — any reformatting breaks the svix signature.
	const rawBody = await request.text();
	const headers: WebhookHeaders = {
		'svix-id': request.headers.get('svix-id') ?? '',
		'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
		'svix-signature': request.headers.get('svix-signature') ?? '',
		'x-webhook-token': request.headers.get('x-webhook-token') ?? ''
	};

	const verification = provider.verifyWebhook(rawBody, headers);
	if (!verification.valid) {
		return json({ error: verification.reason ?? 'invalid signature' }, { status: 401 });
	}

	let event;
	try {
		event = provider.parseWebhookEvent(rawBody);
	} catch (err) {
		return json({ error: 'invalid payload', detail: String(err) }, { status: 400 });
	}

	// Ignore the synthetic test ping from SumoPod's Settings tab.
	if (event.eventType === 'payment.test') {
		return json({ ok: true, test: true });
	}

	const result = await paymentService.handleWebhookEvent(provider, event);
	return json({ ok: true, skipped: result.skipped, paymentId: result.payment?.id ?? null });
};
