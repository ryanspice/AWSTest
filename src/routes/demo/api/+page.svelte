<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import { apiPing, type Ping } from '$lib/api';

	let result: Ping | null = null;
	let err = '';
	let loading = false;

	async function ping() {
		try {
			loading = true;
			err = '';
			result = await apiPing();
		} catch (e) {
			err = (e as Error).message;
			result = null;
		} finally {
			loading = false;
		}
	}

	onMount(ping);
</script>

<h2 class="text-2xl font-bold mb-4">Lambda API (GET)</h2>
<Card title="GET /api/ping" subtitle="API Gateway → Lambda">
	<div class="flex gap-2 mb-4">
		<button
			on:click={ping}
			class="rounded px-3 py-1.5 bg-black text-white disabled:opacity-50"
			disabled={loading}
		>
			{loading ? 'Pinging…' : 'Ping'}
		</button>
	</div>

	{#if err}
		<pre class="text-red-600">{err}</pre>
	{:else if result}
		<pre class="bg-slate-950 text-slate-100 p-3 rounded text-sm overflow-auto">{JSON.stringify(
				result,
				null,
				2
			)}</pre>
		{#if result.echo && (result.echo as any).latencyMs !== undefined}
			<p class="mt-2 text-sm text-gray-600">Latency: {(result.echo as any).latencyMs} ms</p>
		{/if}
	{:else}
		<p class="text-gray-600">Click Ping to call your Lambda.</p>
	{/if}
</Card>
