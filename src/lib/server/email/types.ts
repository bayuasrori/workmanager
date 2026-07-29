export interface EmailAddress {
	address: string;
	name?: string;
}

export interface EmailInput {
	to: string | EmailAddress | (string | EmailAddress)[];
	subject: string;
	html?: string;
	text?: string;
	/** Override default "from". */
	from?: EmailAddress;
	/** Optional reply-to. */
	replyTo?: string;
	/** Provider-specific tags/headers (e.g. transactional category). */
	headers?: Record<string, string>;
}

export interface EmailResult {
	messageId: string;
	/** Provider that handled the send. */
	provider: string;
	/** Raw envelope/response for diagnostics. */
	raw?: unknown;
}

/**
 * Contract every email backend must satisfy. Implementations are constructed
 * with their config and expose a provider-agnostic `send` so the rest of the
 * app never knows whether mail went out via SMTP, an HTTP API, or the console.
 */
export interface EmailProvider {
	readonly name: string;
	send(input: EmailInput): Promise<EmailResult>;
}

export interface EmailConfig {
	/** Resolved default "from" address. */
	from: EmailAddress;
	/** Public app URL for links in templates. */
	appUrl: string;
}
