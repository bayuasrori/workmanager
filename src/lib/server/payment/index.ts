import type { PaymentGateway } from '$lib/server/db/schema';
import { paymentGatewayService } from '$lib/server/service/paymentGateway';
import { env } from '$env/dynamic/private';
import { SumoPodProvider, type SumoPodCredentials } from './sumopod';
import type { PaymentProvider, PaymentProviderName } from './types';

/**
 * Provider factory mirroring the LLM provider pattern (`src/lib/server/llm/provider.ts`).
 * To add a gateway: implement {@link PaymentProvider}, register it here, add the enum
 * value to `paymentGatewayProviderEnum`. Credentials live in the `payment_gateway`
 * row (JSONB) — never in env — so admins can rotate without redeploying.
 */
export function getProvider(
	name: PaymentProviderName,
	credentials: Record<string, unknown>,
	webhookSecret?: string | null
): PaymentProvider | null {
	switch (name) {
		case 'sumopod': {
			const creds = credentials as unknown as SumoPodCredentials;
			// Base URL: DB credentials win, then env override, then built-in sandbox default.
			const baseUrl = creds.baseUrl || env.PAPANIN_PAYMENT_SUMOPOD_BASE_URL || undefined;
			// API key / webhook secret / token: DB row wins, else env.
			const apiKey = creds.apiKey || env.PAPANIN_PAYMENT_SUMOPOD_API_KEY;
			if (!apiKey) {
				throw new Error(
					'API key SumoPod belum dikonfigurasi. Set credentials.apiKey di gateway atau PAPANIN_PAYMENT_SUMOPOD_API_KEY di .env.'
				);
			}
			const resolvedSecret =
				webhookSecret ?? env.PAPANIN_PAYMENT_SUMOPOD_WEBHOOK_SECRET ?? null;
			const resolvedToken =
				creds.webhookToken ?? env.PAPANIN_PAYMENT_SUMOPOD_WEBHOOK_TOKEN ?? undefined;
			return new SumoPodProvider(
				{ apiKey, baseUrl, webhookToken: resolvedToken },
				resolvedSecret
			);
		}
		case 'manual':
		case 'custom':
			// No remote calls — admin records payments by hand.
			return null;
		case 'stripe':
		case 'paypal':
		case 'adyen':
		case 'razorpay':
			// TODO: implement when needed.
			return null;
		default:
			return null;
	}
}

/** Resolve provider from a stored gateway row. */
export function getProviderForGateway(gateway: PaymentGateway): PaymentProvider | null {
	return getProvider(gateway.provider, gateway.credentials, gateway.webhookSecret);
}

/** Look up the active gateway for a provider and build a provider instance. */
export async function getActiveProvider(
	name: PaymentProviderName
): Promise<{ gateway: PaymentGateway; provider: PaymentProvider } | null> {
	const gateway = await paymentGatewayService.getByProvider(name);
	if (!gateway || gateway.status === 'inactive') return null;
	const provider = getProviderForGateway(gateway);
	if (!provider) return null;
	return { gateway, provider };
}
