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

export const GET: RequestHandler = () => json({ ok: true });

export const POST: RequestHandler = async ({ params, request }) => {
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
