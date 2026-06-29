<script lang="ts">
	import { page } from '$app/stores';
	import { addComment, getTaskDetails, removeComment, updateTask } from './data.remote';
	import { toasts } from '$lib/toast.svelte';

	const taskId = $derived($page.params.id ?? '');
	// Guard empty taskId (e.g. during route teardown) so we don't query a uuid column with "".
	const data = $derived(taskId ? await getTaskDetails({ taskId }) : null);

	const comments = $derived(data?.comments ?? []);
	const currentUserId = $derived(data?.currentUser?.id ?? null);

	let name = $state('');
	let projectId = $state('');
	let assigneeId = $state('');
	let statusId = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let commentContent = $state('');
	let commentError = $state('');

	$effect(() => {
		if (!data?.task) return;
		name = data.task.name;
		projectId = data.task.projectId ?? data.projects[0]?.id ?? '';
		assigneeId = data.task.assigneeId ?? '';
		statusId = data.task.statusId ?? '';
		startDate = toDateTimeLocal(data.task.startDate);
		endDate = toDateTimeLocal(data.task.endDate);
	});

	const toDateTimeLocal = (value: Date | string | null | undefined): string => {
		if (!value) return '';
		const d = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(d.getTime())) return '';
		const offset = d.getTimezoneOffset() * 60000;
		return new Date(d.getTime() - offset).toISOString().slice(0, 16);
	};

	const formatTimestamp = (value: string | Date) => {
		const date = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(date.getTime())) {
			return '';
		}
		return new Intl.DateTimeFormat('id-ID', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(date);
	};

	const getInitial = (name: string) => name?.[0]?.toUpperCase() ?? '?';

	const handleUpdateTask = async (event: Event) => {
		event.preventDefault();
		if (!data?.task || !projectId || !taskId) return;
		const trimmedName = name.trim();
		if (!trimmedName) return;
		try {
			await updateTask({
				taskId,
				name: trimmedName,
				projectId,
				assigneeId: assigneeId || undefined,
				statusId: statusId || undefined,
				startDate: startDate ? new Date(startDate) : undefined,
				endDate: endDate ? new Date(endDate) : null
			}).updates(getTaskDetails({ taskId }));
			toasts.success('Task berhasil diperbarui.');
		} catch (error) {
			console.error('Gagal memperbarui task', error);
			toasts.error('Gagal memperbarui task. Silakan coba lagi.');
		}
	};

	const handleAddComment = async (event: Event) => {
		event.preventDefault();
		const trimmed = commentContent.trim();
		if (!trimmed) {
			commentError = 'Komentar tidak boleh kosong.';
			return;
		}
		if (!taskId) return;
		commentError = '';
		try {
			await addComment({ taskId, content: trimmed }).updates(getTaskDetails({ taskId }));
			commentContent = '';
			toasts.success('Komentar ditambahkan.');
		} catch (error) {
			console.error('Gagal menambahkan komentar', error);
			commentError = 'Gagal menambahkan komentar. Silakan coba lagi.';
			toasts.error('Gagal menambahkan komentar. Silakan coba lagi.');
		}
	};

	const handleRemoveComment = async (commentId: string) => {
		if (!confirm('Hapus komentar ini?') || !taskId) return;
		try {
			await removeComment({ commentId }).updates(getTaskDetails({ taskId }));
			toasts.success('Komentar dihapus.');
		} catch (error) {
			console.error('Gagal menghapus komentar', error);
			toasts.error('Gagal menghapus komentar. Silakan coba lagi.');
		}
	};
</script>

<div class="p-4">
	{#if data?.task}
		<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
			<section class="rounded-3xl border border-emerald-200 bg-white shadow-lg p-6">
				<header class="pb-4 border-b border-emerald-100 flex items-start justify-between gap-4">
					<div>
						<h1 class="text-2xl font-extrabold text-emerald-900">Edit Task</h1>
						<p class="text-sm text-emerald-900/70">{data.task.name}</p>
					</div>
				</header>
				<form class="mt-6 space-y-5" onsubmit={handleUpdateTask}>
					<div>
						<label class="label" for="taskName">
							<span class="label-text text-emerald-900/80">Name</span>
						</label>
						<input
							type="text"
							id="taskName"
							bind:value={name}
							class="input input-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400 focus:outline-none"
						/>
					</div>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<label class="label" for="projectId">
								<span class="label-text text-emerald-900/80">Project</span>
							</label>
							<select
								id="projectId"
								bind:value={projectId}
								class="select select-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400"
							>
								{#each data.projects as project (project.id)}
									<option value={project.id}>{project.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="label" for="assigneeId">
								<span class="label-text text-emerald-900/80">Assignee</span>
							</label>
							<select
								id="assigneeId"
								bind:value={assigneeId}
								class="select select-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400"
							>
								<option value="">Tidak ada</option>
								{#each data.users as user (user.id)}
									<option value={user.id}>{user.username}</option>
								{/each}
							</select>
						</div>
					</div>
					<div>
						<label class="label" for="statusId">
							<span class="label-text text-emerald-900/80">Status</span>
						</label>
						<select
							id="statusId"
							bind:value={statusId}
							class="select select-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400"
						>
							<option value="">Tanpa status</option>
							{#each data.taskStatuses as status (status.id)}
								<option value={status.id}>{status.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<label class="label" for="startDate">
								<span class="label-text text-emerald-900/80">Tanggal Mulai</span>
							</label>
							<input
								type="datetime-local"
								id="startDate"
								bind:value={startDate}
								class="input input-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400 focus:outline-none"
							/>
						</div>
						<div>
							<label class="label" for="endDate">
								<span class="label-text text-emerald-900/80">Tanggal Selesai</span>
							</label>
							<input
								type="datetime-local"
								id="endDate"
								bind:value={endDate}
								class="input input-bordered w-full bg-emerald-50/60 border-emerald-200 focus:border-emerald-400 focus:outline-none"
							/>
						</div>
					</div>
					<button
						type="submit"
						class="btn bg-emerald-600 border-none hover:bg-emerald-700 text-emerald-50"
					>
						Perbarui Task
					</button>
				</form>
			</section>

			<section
				class="rounded-3xl border border-emerald-300 bg-emerald-50/70 shadow-lg p-0 overflow-hidden"
			>
				<header class="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-emerald-50">
					<h2 class="text-lg font-semibold flex items-center gap-2">
						<span class="text-xl">💬</span>
						Diskusi Task
					</h2>
					<p class="text-sm text-emerald-100/80">
						Obrolkan update, hambatan, atau catatan penting bersama tim.
					</p>
				</header>
				<div class="flex flex-col gap-4 px-5 py-6 max-h-[32rem] overflow-y-auto">
					{#if comments.length}
						{#each comments as comment (comment.id)}
							{@const isOwn = comment.userId === currentUserId}
							<div class={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
								<article
									class={`flex max-w-[85%] flex-col gap-2 rounded-2xl border shadow-md p-4 ${
										isOwn
											? 'border-emerald-700 bg-emerald-600 text-emerald-50'
											: 'border-emerald-200 bg-white text-emerald-900'
									}`}
								>
									<header class="flex items-center justify-between gap-3">
										<div class="flex items-center gap-3">
											<div
												class={`flex h-9 w-9 items-center justify-center rounded-full font-semibold ${
													isOwn
														? 'bg-emerald-500/40 text-emerald-50'
														: 'bg-emerald-100 text-emerald-700'
												}`}
											>
												{getInitial(comment.username)}
											</div>
											<div>
												<p class="text-sm font-semibold leading-tight">
													{comment.username}
												</p>
												<p class="text-xs opacity-70 leading-tight">
													{formatTimestamp(comment.createdAt)}
												</p>
											</div>
										</div>
										{#if isOwn}
											<button
												type="button"
												class="btn btn-xs border-none bg-emerald-500/30 text-emerald-50 hover:bg-emerald-500/50"
												onclick={() => handleRemoveComment(comment.id)}
											>
												Hapus
											</button>
										{/if}
									</header>
									<p
										class={`text-sm leading-relaxed whitespace-pre-wrap ${isOwn ? 'text-emerald-50/90' : 'text-emerald-900'}`}
									>
										{comment.content}
									</p>
								</article>
							</div>
						{/each}
					{:else}
						<p
							class="rounded-xl border border-dashed border-emerald-300 bg-emerald-100/60 px-4 py-6 text-sm text-emerald-900/70"
						>
							Belum ada komentar. Mulai diskusi pertama Anda di bawah ini.
						</p>
					{/if}
				</div>
				<footer class="border-t border-emerald-200 bg-white px-5 py-4">
					{#if commentError}
						<div class="alert alert-warning text-sm mb-3">
							<span>{commentError}</span>
						</div>
					{/if}
					<form class="space-y-3" onsubmit={handleAddComment}>
						<textarea
							class="textarea textarea-bordered w-full min-h-[4.5rem] bg-emerald-50/60 border-emerald-200 focus:border-emerald-400 focus:outline-none"
							placeholder="Tulis komentar atau update terbaru..."
							bind:value={commentContent}
							required
						></textarea>
						<div class="flex items-center justify-end gap-2">
							<button
								type="submit"
								class="btn bg-emerald-600 text-emerald-50 border-none hover:bg-emerald-700"
							>
								Kirim Komentar
							</button>
						</div>
					</form>
				</footer>
			</section>
		</div>
	{/if}
</div>
