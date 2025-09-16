<script lang="ts">
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
</script>

<!-- Navigation Header -->
<nav class="navbar bg-base-100 shadow-lg">
	<div class="navbar-start">
		<a href="/" class="btn btn-ghost text-xl font-bold text-primary">WorkManager</a>
	</div>
	<div class="navbar-end">
		{#if data.isAuthenticated}
			<a href="/dashboard" class="btn btn-primary">Go to Dashboard</a>
		{:else}
			<a href="/login" class="btn btn-primary">Get Started</a>
		{/if}
	</div>
</nav>

<!-- Hero Section -->
<section class="hero min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<h1 class="text-5xl font-bold text-base-content mb-6">
				Streamline Your
				<span class="text-primary">Workflow</span>
			</h1>
			<p class="text-lg text-base-content/70 mb-8">
				The ultimate work management platform for teams. Organize projects, track tasks, and collaborate seamlessly with your organization.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				{#if data.isAuthenticated}
					<a href="/dashboard" class="btn btn-primary btn-lg">Go to Dashboard</a>
				{:else}
					<a href="/login" class="btn btn-primary btn-lg">Start Free Trial</a>
				{/if}
				<a href="/public-board/create" class="btn btn-accent btn-lg">Create Public Board</a>
				<a href="#features" class="btn btn-outline btn-lg">Learn More</a>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section id="features" class="py-20 bg-base-100">
	<div class="container mx-auto px-4">
		<div class="text-center mb-16">
			<h2 class="text-4xl font-bold text-base-content mb-4">Powerful Features</h2>
			<p class="text-lg text-base-content/70 max-w-2xl mx-auto">
				Everything you need to manage your work efficiently and keep your team organized.
			</p>
		</div>
		
		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
			<!-- Feature 1 -->
			<div class="card bg-base-200 shadow-lg">
				<div class="card-body text-center">
					<div class="text-4xl mb-4">👥</div>
					<h3 class="card-title justify-center mb-2">Team Management</h3>
					<p class="text-base-content/70">
						Create and manage organizations with role-based access control. Invite team members and assign permissions.
					</p>
				</div>
			</div>
			
			<!-- Feature 2 -->
			<div class="card bg-base-200 shadow-lg">
				<div class="card-body text-center">
					<div class="text-4xl mb-4">📋</div>
					<h3 class="card-title justify-center mb-2">Project Tracking</h3>
					<p class="text-base-content/70">
						Organize your work into projects and track progress with customizable task statuses and deadlines.
					</p>
				</div>
			</div>
			
			<!-- Feature 3 -->
			<div class="card bg-base-200 shadow-lg">
				<div class="card-body text-center">
					<div class="text-4xl mb-4">✅</div>
					<h3 class="card-title justify-center mb-2">Task Management</h3>
					<p class="text-base-content/70">
						Create, assign, and track tasks with comments, status updates, and real-time collaboration.
					</p>
				</div>
			</div>
			
			<!-- Feature 4 -->
			<div class="card bg-base-200 shadow-lg">
				<div class="card-body text-center">
					<div class="text-4xl mb-4">🌐</div>
					<h3 class="card-title justify-center mb-2">Public Boards</h3>
					<p class="text-base-content/70">
						Create public boards for free to share with anyone. Perfect for open source projects and community collaboration.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Tech Stack Section -->
<section class="py-20 bg-base-200">
	<div class="container mx-auto px-4">
		<div class="text-center mb-16">
			<h2 class="text-4xl font-bold text-base-content mb-4">Built with Modern Technology</h2>
			<p class="text-lg text-base-content/70 max-w-2xl mx-auto">
				Powered by cutting-edge technologies for performance, reliability, and developer experience.
			</p>
		</div>
		
		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body text-center">
					<div class="text-2xl font-bold text-primary mb-2">SvelteKit</div>
					<p class="text-sm text-base-content/70">Modern web framework</p>
				</div>
			</div>
			
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body text-center">
					<div class="text-2xl font-bold text-primary mb-2">Drizzle ORM</div>
					<p class="text-sm text-base-content/70">Type-safe database</p>
				</div>
			</div>
			
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body text-center">
					<div class="text-2xl font-bold text-primary mb-2">Tailwind CSS</div>
					<p class="text-sm text-base-content/70">Utility-first styling</p>
				</div>
			</div>
			
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body text-center">
					<div class="text-2xl font-bold text-primary mb-2">Oslo Auth</div>
					<p class="text-sm text-base-content/70">Secure authentication</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="py-20 bg-primary text-primary-content">
	<div class="container mx-auto px-4 text-center">
		<h2 class="text-4xl font-bold mb-4">Ready to Get Started?</h2>
		<p class="text-xl mb-8 opacity-90">
			Join thousands of teams already using WorkManager to streamline their workflow.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			{#if data.isAuthenticated}
				<a href="/dashboard" class="btn btn-secondary btn-lg">Go to Dashboard</a>
			{:else}
				<a href="/login" class="btn btn-secondary btn-lg">Start Your Free Trial</a>
			{/if}
			<a href="/public-board/create" class="btn btn-accent btn-lg">Create Public Board</a>
		</div>
	</div>
</section>

<!-- Footer -->
<footer class="footer footer-center p-10 bg-base-200 text-base-content">
	<div>
		<p class="font-bold text-lg">WorkManager</p>
		<p class="text-base-content/70">Streamline your workflow, organize your team.</p>
		<p class="text-sm text-base-content/50 mt-4">
			Built with ❤️ using SvelteKit, Drizzle ORM, and Tailwind CSS
		</p>
	</div>
</footer>
