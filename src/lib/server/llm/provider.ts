import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { env } from '$env/dynamic/private';
import type { LanguageModel } from 'ai';

/**
 * Provider-agnostic model factory, picked at runtime via PAPANIN_LLM_PROVIDER:
 *  - "anthropic"          (default) — Anthropic-compatible endpoint (e.g. z.ai /api/anthropic).
 *  - "openai-compatible"            — any OpenAI-compatible endpoint (e.g. z.ai /api/paas/v4, OpenAI, OpenRouter).
 *
 * NOTE: vars are prefixed `PAPANIN_LLM_*` to avoid collision with any LLM_*
 * env injected by the dev/agent runtime (e.g. the editor's own coding-plan LLM).
 */
export function getModel(): LanguageModel {
	const {
		PAPANIN_LLM_PROVIDER = 'anthropic',
		PAPANIN_LLM_BASE_URL,
		PAPANIN_LLM_API_KEY,
		PAPANIN_LLM_MODEL,
		PAPANIN_LLM_PROVIDER_NAME = 'llm'
	} = env;

	if (!PAPANIN_LLM_API_KEY || !PAPANIN_LLM_MODEL) {
		throw new Error(
			'LLM belum dikonfigurasi. Set PAPANIN_LLM_API_KEY dan PAPANIN_LLM_MODEL di .env.'
		);
	}

	if (PAPANIN_LLM_PROVIDER === 'openai-compatible') {
		return createOpenAICompatible({
			name: PAPANIN_LLM_PROVIDER_NAME,
			baseURL: PAPANIN_LLM_BASE_URL ?? '',
			apiKey: PAPANIN_LLM_API_KEY
		}).chatModel(PAPANIN_LLM_MODEL);
	}

	// default: anthropic-compatible (z.ai pakai saldo yang sama dgn Claude Code)
	return createAnthropic({
		baseURL: PAPANIN_LLM_BASE_URL,
		apiKey: PAPANIN_LLM_API_KEY
	})(PAPANIN_LLM_MODEL);
}
