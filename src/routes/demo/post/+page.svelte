<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import { apiEcho, type Ping } from '$lib/api';

	let name = 'Svelte on AWS';
	let count = 1;
	let result: Ping | null = null;
	let err = '';
	let loading = false;

	async function submit() {
		try {
			loading = true;
			err = '';
			result = await apiEcho({ name, count });
		} catch (e) {
			err = (e as Error).message;
			result = null;
		} finally {
			loading = false;
		}
	}
</script>

<h2 class="text-2xl font-bold mb-4">Lambda API (POST)</h2>
<Card title="POST /api/echo" subtitle="Sends JSON; Lambda echoes payload + metadata">
	<form class="flex flex-col gap-3 max-w-md" on:submit|preventDefault={submit}>
		<label class="flex flex-col gap-1">
			<span class="text-sm text-gray-600">name</span>
			<input class="border rounded px-3 py-2" bind:value={name} />
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm text-gray-600">count</span>
			<input class="border rounded px-3 py-2" type="number" bind:value={count} min="1" />
		</label>
		<button class="rounded px-3 py-2 bg-black text-white disabled:opacity-50" disabled={loading}>
			{loading ? 'Posting…' : 'Send'}
		</button>
	</form>

	{#if err}
		<pre class="text-red-600 mt-4">{err}</pre>
	{/if}

	{#if result}
		<h3 class="font-semibold mt-6">Response</h3>
		<pre class="bg-slate-950 text-slate-100 p-3 rounded text-sm overflow-auto">{JSON.stringify(
				result,
				null,
				2
			)}</pre>
	{/if}
</Card>
