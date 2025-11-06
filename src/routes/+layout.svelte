<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
	<nav class="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
		<div class="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
			<a href="/" class="font-bold">SvelteKit × AWS Demo</a>
			<div class="ml-auto flex gap-3 text-sm">
				<a class="hover:underline" href="/demo/api">API</a>
				<a class="hover:underline" href="/demo/post">POST</a>
				<a class="hover:underline" href="/demo/ssr">SSR</a>
				<a class="hover:underline" href="/demo/static">Static</a>
			</div>
		</div>
	</nav>

	<main class="mx-auto max-w-5xl px-4 py-8">
		{@render children()}
	</main>

	<footer class="mx-auto max-w-5xl px-4 py-8 text-xs text-gray-500">
		<p>Deployed: CloudFront → S3 (static) and /api/* → API Gateway HTTP API → Lambda.</p>
	</footer>
</div>
