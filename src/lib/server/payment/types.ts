import type { paymentGatewayProviderEnum, paymentStatusEnum } from '$lib/server/db/schema';

export type PaymentProviderName = (typeof paymentGatewayProviderEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

/** Input for creating a payment intent. Provider-agnostic. */
export interface CreatePaymentInput {
	/** Merchant order reference (our side). Sent as `order_id` to SumoPod. */
	orderId: string;
	/** Smallest currency unit for some providers, but SumoPod expects IDR integer amount. */
	amount: number;
	currency: string;
	/** Optional TTL in hours. */
	expiresInHours?: number;
	/** Optional override return URLs. */
	successReturnUrl?: string;
	cancelReturnUrl?: string;
	/** Optional provider-specific method code (e.g. "QRIS"). */
	paymentMethodTypeCode?: string;
	description?: string;
	/** Customer-facing metadata, passed through where supported. */
	customer?: { email?: string; name?: string };
}

/** Normalized result of creating a payment intent. */
export interface CreatePaymentResult {
	/** Provider's payment id (stored as `payment.intent_id`). */
	paymentId: string;
	/** URL the customer visits to pay. */
	paymentLinkUrl: string;
	/** Provider status string (raw). */
	status: string;
	/** ISO timestamp string of expiry, if provided. */
	expiresAt?: string | null;
	/** Fee deducted by provider (smallest unit / IDR). */
	fee?: number | null;
	/** Net amount settled to merchant. */
	netAmount?: number | null;
	/** Raw provider response for diagnostics. */
	raw: unknown;
}

/** Headers needed to verify a webhook. Keys are lowercased header names. */
export type WebhookHeaders = Record<string, string>;

/** Result of verifying + parsing a webhook. */
export interface WebhookVerification {
	valid: boolean;
	reason?: string;
}

/** Normalized webhook event used to update our `payment` row. */
export interface WebhookEvent {
	/** Provider event type, e.g. "payment.completed". */
	eventType: string;
	/** Provider's payment id — matches our `payment.intent_id`. */
	paymentId?: string;
	/** Order id we sent when creating the intent — matches our `payment.external_id`. */
	orderId?: string;
	/** Raw provider status (e.g. "completed", "failed", "expired"). */
	status?: string;
	amount?: number;
	fee?: number;
	netAmount?: number;
	paymentMethod?: string;
	completedAt?: string | null;
	/** Raw payload for audit trail (stored into `payment.metadata`). */
	raw: unknown;
}

/**
 * Contract every payment gateway implementation must satisfy.
 * Implementations are constructed with their credentials + webhook secret
 * and expose provider-agnostic methods so the service layer stays portable.
 */
export interface PaymentProvider {
	readonly name: PaymentProviderName;
	createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
	verifyWebhook(rawBody: string, headers: WebhookHeaders): WebhookVerification;
	parseWebhookEvent(rawBody: string): WebhookEvent;
	/** Map a provider status string to our internal `payment_status` enum. */
	normalizeStatus(externalStatus: string | undefined): PaymentStatus;
}
