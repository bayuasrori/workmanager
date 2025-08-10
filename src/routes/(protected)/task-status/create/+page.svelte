<script lang="ts">
    import type { ActionData } from './$types';

    //export let form: ActionData;
</script>

<div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Create New Task Status</h1>
    <form method="POST" class="space-y-4">
        <div>
            <label class="label" for="statusName">
                <span class="label-text">Name</span>
            </label>
            <input type="text" name="name" id="statusName" class="input input-bordered w-full" />
        </div>
        <button type="submit" class="btn btn-primary">Create</button>
    </form>
</div>
