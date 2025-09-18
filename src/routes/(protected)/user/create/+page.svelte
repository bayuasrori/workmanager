<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Create User</h1>
	<form method="POST" class="space-y-4">
		<div>
			<label class="label" for="username">
				<span class="label-text">Username</span>
			</label>
			<input type="text" id="username" name="username" class="input input-bordered w-full" />
		</div>
		<div>
			<label class="label" for="age">
				<span class="label-text">Age</span>
			</label>
			<input type="number" id="age" name="age" class="input input-bordered w-full" />
		</div>
		<div>
			<label class="label" for="password">
				<span class="label-text">Password</span>
			</label>
			<input type="text" id="password" name="password" class="input input-bordered w-full" />
		</div>
		<button type="submit" class="btn btn-primary">Create</button>
	</form>
</div>
