export { generate } from './generate';
export { getModel } from './provider';
export { MASTER_PROMPT, composeSystemPrompt } from './prompts';

import { generate as generateFn } from './generate';

/**
 * Reusable LLM facade. Import this anywhere you need AI:
 *
 *   import { llm } from '$lib/server/llm';
 *   const drafts = await llm.generate({ system, prompt, schema });
 */
export const llm = {
	generate: generateFn
};
