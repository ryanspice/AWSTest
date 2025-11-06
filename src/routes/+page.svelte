<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	const features = [
		{
			href: '/demo/api',
			title: 'Lambda API (GET)',
			desc: 'Ping the API Gateway + Lambda and show latency/region.'
		},
		{
			href: '/demo/post',
			title: 'Lambda API (POST)',
			desc: 'POST JSON to your Lambda and echo back.'
		},
		{
			href: '/demo/ssr',
			title: 'SSR/Prerender',
			desc: 'Server data via +page.server.ts (prerender in static, SSR on Lambda).'
		},
		{
			href: '/demo/static',
			title: 'Static page',
			desc: 'Fully static HTML from S3 via CloudFront with SPA fallback.'
		}
	];
</script>

<header class="mb-8">
	<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight">SvelteKit on AWS</h1>
	<p class="text-gray-600 mt-2">
		Static site on S3 behind CloudFront, plus /api/* on Lambda. Minimal, production-ish.
	</p>
</header>

<div class="grid md:grid-cols-2 gap-6">
	{#each features as f}
		<a href={f.href} class="block transition hover:-translate-y-0.5">
			<Card title={f.title} subtitle={f.href}>
				<p>{f.desc}</p>
			</Card>
		</a>
	{/each}

	<Card title="Tech">
		<ul class="list-disc ml-5">
			<li>S3 private, served via CloudFront OAC</li>
			<li>API Gateway HTTP API → Lambda (Node 20)</li>
			<li>SPA deep-link fallback (403/404 → /index.html)</li>
			<li>CI: build → sync to S3 → CloudFront invalidation</li>
		</ul>
	</Card>

	<Card title="How to extend">
		<ul class="list-disc ml-5">
			<li>Add more /api routes in Lambda (e.g. /api/echo)</li>
			<li>Swap adapter for SSR-on-Lambda without changing pages</li>
			<li>Add a custom domain and ACM cert in us-east-1</li>
		</ul>
	</Card>
</div>
