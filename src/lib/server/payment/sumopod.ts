import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
	CreatePaymentInput,
	CreatePaymentResult,
	PaymentProvider,
	PaymentStatus,
	WebhookEvent,
	WebhookHeaders,
	WebhookVerification
} from './types';

export interface SumoPodCredentials {
	apiKey: string;
	/** Override base URL (e.g. sandbox vs production). */
	baseUrl?: string;
	/** Optional simple token verification (X-Webhook-Token), alternative to svix signature. */
	webhookToken?: string;
}

const SANDBOX_BASE_URL = 'https://api-pay-sandbox.sumopod.com/api/v1';

export class SumoPodProvider implements PaymentProvider {
	readonly name = 'sumopod' as const;
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly webhookSecret: string | null;
	private readonly webhookToken: string | null;

	constructor(credentials: SumoPodCredentials, webhookSecret?: string | null) {
		if (!credentials.apiKey) {
			throw new Error('SumoPod credentials.apiKey wajib diisi.');
		}
		this.apiKey = credentials.apiKey;
		this.baseUrl = (credentials.baseUrl || SANDBOX_BASE_URL).replace(/\/$/, '');
		this.webhookSecret = webhookSecret ?? null;
		this.webhookToken = credentials.webhookToken ?? null;
	}

	async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
		const body: Record<string, unknown> = {
			order_id: input.orderId,
			amount: input.amount,
			currency: input.currency
		};
		if (input.expiresInHours !== undefined) body.expires_in_hours = input.expiresInHours;
		if (input.successReturnUrl) body.success_return_url = input.successReturnUrl;
		if (input.cancelReturnUrl) body.cancel_return_url = input.cancelReturnUrl;
		if (input.paymentMethodTypeCode) body.payment_method_type_code = input.paymentMethodTypeCode;

		const res = await fetch(`${this.baseUrl}/payments`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': this.apiKey
			},
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			const text = await res.text().catch(() => '');
			throw new Error(`SumoPod createPayment gagal (HTTP ${res.status}): ${text.slice(0, 500)}`);
		}

		const data = (await res.json()) as {
			payment_id: string;
			payment_link_url: string;
			status: string;
			expires_at?: string | null;
			fee?: number | null;
			net_amount?: number | null;
		};

		return {
			paymentId: data.payment_id,
			paymentLinkUrl: data.payment_link_url,
			status: data.status,
			expiresAt: data.expires_at ?? null,
			fee: data.fee ?? null,
			netAmount: data.net_amount ?? null,
			raw: data
		};
	}

	verifyWebhook(rawBody: string, headers: WebhookHeaders): WebhookVerification {
		const svixId = headers['svix-id'];
		const svixTimestamp = headers['svix-timestamp'];
		const svixSignature = headers['svix-signature'];

		// Path A: full svix signature verification (preferred).
		if (svixId && svixTimestamp && svixSignature && this.webhookSecret) {
			const ok = this.verifySvixSignature(
				this.webhookSecret,
				svixId,
				svixTimestamp,
				svixSignature,
				rawBody
			);
			return ok ? { valid: true } : { valid: false, reason: 'svix signature mismatch' };
		}

		// Path B: simple shared token (X-Webhook-Token).
		if (this.webhookToken) {
			const received = headers['x-webhook-token'];
			const ok =
				typeof received === 'string' &&
				received.length === this.webhookToken.length &&
				timingSafeEqual(Buffer.from(received), Buffer.from(this.webhookToken));
			return ok ? { valid: true } : { valid: false, reason: 'webhook token mismatch' };
		}

		return {
			valid: false,
			reason: 'tidak ada svix signature/webhook secret maupun webhook token'
		};
	}

	parseWebhookEvent(rawBody: string): WebhookEvent {
		const parsed = JSON.parse(rawBody) as {
			event_type?: string;
			data?: {
				payment_id?: string;
				order_id?: string;
				amount?: number;
				fee?: number;
				net_amount?: number;
				status?: string;
				payment_method?: string;
				completed_at?: string | null;
			};
		};

		const data = parsed.data ?? {};
		return {
			eventType: parsed.event_type ?? '',
			paymentId: data.payment_id,
			orderId: data.order_id,
			status: data.status,
			amount: data.amount,
			fee: data.fee,
			netAmount: data.net_amount,
			paymentMethod: data.payment_method,
			completedAt: data.completed_at ?? null,
			raw: parsed
		};
	}

	normalizeStatus(externalStatus: string | undefined): PaymentStatus {
		switch (externalStatus) {
			case 'completed':
			case 'succeeded':
			case 'success':
			case 'paid':
				return 'succeeded';
			case 'failed':
			case 'expired':
			case 'canceled':
			case 'cancelled':
				return 'failed';
			case 'refunded':
			case 'refund':
				return 'refunded';
			case 'pending':
			default:
				return 'pending';
		}
	}

	/**
	 * Svix-style HMAC verification. Reference: SumoPod docs.
	 * signed_content = `${svix_id}.${svix_timestamp}.${raw_body}`
	 * secret = base64-decoded `whsec_...` (strip prefix).
	 * signature = base64(HMAC_SHA256(secret, signed_content))
	 */
	private verifySvixSignature(
		secret: string,
		svixId: string,
		svixTimestamp: string,
		svixSignature: string,
		rawBody: string
	): boolean {
		// Guard against timestamp replay (>5 min old).
		const ts = Number(svixTimestamp);
		if (!Number.isFinite(ts)) return false;
		const ageMs = Math.abs(Date.now() - ts * 1000);
		if (ageMs > 5 * 60 * 1000) return false;

		const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
		const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
		const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64');

		// svix-signature may carry multiple space-separated "v1,<sig>" values
		// (~24h after a key rotation).
		const candidates = svixSignature
			.split(' ')
			.map((s) => s.split(',')[1])
			.filter((s): s is string => typeof s === 'string');

		return candidates.some((sig) => {
			try {
				const a = Buffer.from(sig);
				const b = Buffer.from(expected);
				return a.length === b.length && timingSafeEqual(a, b);
			} catch {
				return false;
			}
		});
	}
}
