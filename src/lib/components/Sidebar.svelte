<script lang="ts">
	import type { PageData } from '../routes/$types';

	export let data: PageData;
</script>

<ul class="menu bg-base-200 w-56 min-h-full text-base-content">
	{#each data.organizations as org}
		<li>
			<details open>
				<summary>{org.name}</summary>
				<ul>
					{#each org.projects as project}
						<li><a href="/project/{project.id}/tasks">{project.name}</a></li>
					{/each}
				</ul>
			</details>
		</li>
	{/each}
	<li><a href="/task-status">Task Statuses</a></li>
</ul>
