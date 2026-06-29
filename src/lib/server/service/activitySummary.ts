import * as v from 'valibot';
import { composeSystemPrompt, llm } from '$lib/server/llm';

export type ActivityItem = {
	description: string | null;
	type: string;
	projectName: string;
	createdAt: Date;
};

const summarySchema = v.object({
	summary: v.pipe(v.string(), v.nonEmpty('Ringkasan wajib'))
});

function formatDate(value: Date): string {
	try {
		return value.toISOString().slice(0, 10);
	} catch {
		return '';
	}
}

/** Summarize a list of recent activities into a short Indonesian paragraph via the LLM. */
export async function summarizeRecentActivity(activities: ActivityItem[]): Promise<string> {
	if (activities.length === 0) {
		return 'Belum ada aktivitas terbaru untuk dirangkum.';
	}

	const lines = activities
		.map(
			(a) =>
				`[${formatDate(a.createdAt)}] ${a.type} — ${a.description ?? '(tanpa deskripsi)'} @ ${a.projectName}`
		)
		.join('\n');

	const { summary } = await llm.generate({
		system: composeSystemPrompt(
			[
				'Peran: peringkas aktivitas tim menjadi narasi singkat (2-4 kalimat, maks ~60 kata).',
				'Tekankan: fokus/pekerjaan utama yang berjalan, pencapaian/progres, dan hal yang butuh perhatian jika terlihat.',
				'Tulis natural sebagai paragraf, bukan daftar poin.'
			].join('\n')
		),
		prompt: `Daftar aktivitas terbaru (terbaru di atas):\n${lines}`,
		schema: summarySchema,
		maxTokens: 400
	});
	return summary;
}
