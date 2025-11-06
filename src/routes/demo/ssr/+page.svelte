<script lang="ts">
	export let data: { time: any; builtAt: string };
</script>

<h2 class="text-2xl font-bold mb-4">Server-rendered data</h2>
<p class="text-gray-600 mb-4">
	With the static adapter this page is prerendered during build. If you deploy with a Lambda SSR
	adapter, this will run on each request.
</p>

<div class="grid md:grid-cols-2 gap-6">
	<section class="rounded-2xl border p-4 bg-white/60">
		<h3 class="font-semibold mb-2">Built</h3>
		<pre class="text-sm">{data.builtAt}</pre>
	</section>
	<section class="rounded-2xl border p-4 bg-white/60">
		<h3 class="font-semibold mb-2">WorldTimeAPI snapshot</h3>
		<pre class="text-sm overflow-auto">{JSON.stringify(data.time, null, 2)}</pre>
	</section>
</div>
