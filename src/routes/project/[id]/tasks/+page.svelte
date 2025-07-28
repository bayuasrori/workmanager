<script lang="ts">
    import type { PageData } from './$types';
    export let data: PageData;

    function dragStart(event: DragEvent, taskId: string) {
        event.dataTransfer?.setData('text/plain', taskId);
    }

    function allowDrop(event: DragEvent) {
        event.preventDefault();
    }

    async function drop(event: DragEvent, newStatusId: string) {
        event.preventDefault();
        const taskId = event.dataTransfer?.getData('text/plain');
        if (taskId) {
            const formData = new FormData();
            formData.append('taskId', taskId);
            formData.append('newStatusId', newStatusId);

            await fetch('?/updateTaskStatus', {
                method: 'POST',
                body: formData
            });

            // Update the task status in the local data
            const taskToUpdate = data.tasks.find(t => t.id === taskId);
            if (taskToUpdate) {
                taskToUpdate.statusId = newStatusId;
                data.tasks = [...data.tasks]; // Trigger Svelte reactivity
            }
        }
    }
</script>

<h1 class="text-2xl font-bold mb-4">Tasks for Project</h1>

<a href="/tasks/create?projectId={data.tasks[0]?.projectId}" class="btn btn-primary mb-4">Create New Task</a>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
    {#each data.taskStatuses as status}
        <div
            class="card bg-base-200 shadow-xl"
            ondragover={allowDrop}
            ondrop={(event) => drop(event, status.id)}
            role="group"
            aria-labelledby="status-{status.id}"
        >
            <div class="card-body">
                <h2 class="card-title" id="status-{status.id}">{status.name}</h2>
                {#if data.tasks && data.tasks.filter(task => task.statusId === status.id).length > 0}
                    <ul class="space-y-2">
                        {#each data.tasks.filter(task => task.statusId === status.id) as task}
                            <li
                                class="border p-2 rounded-md"
                                draggable="true"
                                ondragstart={(event) => dragStart(event, task.id)}
                            >
                                <h3 class="font-semibold">{task.name}</h3>
                                <p class="text-sm text-gray-500">asignee {task.assignee?.username}</p>
                                <a href="/tasks/{task.id}" class="btn btn-sm btn-info mt-2">View Task</a>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p>No tasks in this status.</p>
                {/if}
            </div>
        </div>
    {/each}
</div>

{#if !data.tasks || data.tasks.length === 0}
    <p class="mt-4">No tasks found for this project.</p>
{/if}
