<script lang="ts">
	// Purely static content to show CloudFront+S3 delivery.
	const tips = [
		'Bucket is private; CloudFront uses OAC to read objects.',
		'403/404 map to /index.html for SPA deep links.',
		'Use a single /* invalidation per deploy.'
	];
</script>

<h2 class="text-2xl font-bold mb-4">Static page</h2>
<p class="text-gray-600 mb-4">This page is prerendered HTML served from S3 via CloudFront.</p>

<ul class="list-disc ml-6">
	{#each tips as t}<li>{t}</li>{/each}
</ul>
