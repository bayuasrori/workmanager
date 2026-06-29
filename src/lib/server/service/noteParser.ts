import * as v from 'valibot';
import { composeSystemPrompt, llm } from '$lib/server/llm';

export const taskDraftSchema = v.object({
	title: v.pipe(v.string(), v.nonEmpty('Judul wajib')),
	description: v.optional(v.string()),
	assigneeName: v.optional(v.string()),
	statusName: v.optional(v.string()),
	startDate: v.optional(v.string()),
	dueDate: v.optional(v.string())
});

export type TaskDraft = v.InferOutput<typeof taskDraftSchema>;

const parseListSchema = v.object({
	tasks: v.array(taskDraftSchema)
});

type Named = { id: string; name: string };
type Member = { id: string; username: string };

type ParseContext = {
	statuses: Named[];
	members: Member[];
};

function buildSystemPrompt(ctx: ParseContext): string {
	const statusList = ctx.statuses.map((s) => `- ${s.name}`).join('\n') || '(belum ada status)';
	const memberList = ctx.members.map((m) => `- ${m.username}`).join('\n') || '(belum ada anggota)';
	return composeSystemPrompt(
		[
			'Peran: parser notulensi rapat menjadi daftar task.',
			'Aturan khusus:',
			'- "title": singkat, padat, aksi (mis. "Susun proposal Q3").',
			'- "description": konteks/detail singkat jika ada.',
			'- "statusName": hanya pilih dari daftar status tersedia. Jika ragu, kosongkan.',
			'- "assigneeName": hanya pilih dari daftar anggota tersedia (cocokkan orang yang disebut). Jika tidak disebut, kosongkan.',
			'- "startDate" / "dueDate": isi jika tanggal/tenggat disebut; jika tidak, kosongkan.',
			'- Lewati item non-aksi (sekadar informasi/closing).'
		].join('\n'),
		`Status tersedia:\n${statusList}`,
		`Anggota tersedia:\n${memberList}`
	);
}

/** Parse free-form notes into task drafts via the LLM. Returns drafts with NAME references (not ids). */
export async function parseNotesToTasks(notes: string, ctx: ParseContext): Promise<TaskDraft[]> {
	const trimmed = notes.trim();
	if (!trimmed) return [];

	const { tasks } = await llm.generate({
		system: buildSystemPrompt(ctx),
		prompt: `Notulensi:\n"""\n${trimmed}\n"""`,
		schema: parseListSchema,
		maxTokens: 2500
	});
	return tasks;
}

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

/** Map a draft's name references to real ids + parse dates. Used by the create command. */
export function resolveTaskFields(
	draft: TaskDraft,
	ctx: ParseContext
): {
	statusId: string | null;
	assigneeId: string | null;
	startDate: Date | null;
	endDate: Date | null;
} {
	const status = ctx.statuses.find((s) => norm(s.name) === norm(draft.statusName));
	const assignee = ctx.members.find((m) => norm(m.username) === norm(draft.assigneeName));
	return {
		statusId: status?.id ?? null,
		assigneeId: assignee?.id ?? null,
		startDate: toDate(draft.startDate),
		endDate: toDate(draft.dueDate)
	};
}

function toDate(value: string | null | undefined): Date | null {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}
