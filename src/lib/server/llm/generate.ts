import { generateText, Output, type LanguageModel } from 'ai';
import { valibotSchema } from '@ai-sdk/valibot';
import type * as v from 'valibot';
import { getModel } from './provider';

/**
 * Generate structured (JSON) output validated against a valibot schema.
 * This is the single reusable entry point for any LLM-powered feature —
 * import { llm } from '$lib/server/llm' and call llm.generate(...).
 */
export async function generate<T extends v.ObjectSchema<any, any>>({
	system,
	prompt,
	schema,
	model,
	maxTokens
}: {
	system?: string;
	prompt: string;
	schema: T;
	model?: LanguageModel;
	maxTokens?: number;
}): Promise<v.InferOutput<T>> {
	const { output } = await generateText({
		model: model ?? getModel(),
		system,
		prompt,
		maxOutputTokens: maxTokens,
		output: Output.object({ schema: valibotSchema(schema) })
	}).catch((err: unknown) => {
		// Surface the real vendor error (z.ai wraps details in responseBody).
		console.error('[LLM generate failed]', {
			name: err instanceof Error ? err.name : typeof err,
			message: err instanceof Error ? err.message : err,
			statusCode: (err as { statusCode?: number })?.statusCode,
			url: (err as { url?: string })?.url,
			responseBody: (err as { responseBody?: unknown })?.responseBody
		});
		throw err;
	});
	return output as v.InferOutput<T>;
}
