<script lang="ts">
	export let title = '';
	export let subtitle = '';
</script>

<section class="rounded-2xl border p-4 md:p-6 shadow-sm bg-white/60 backdrop-blur">
	<header class="mb-3">
		<h3 class="text-lg font-semibold">{title}</h3>
		{#if subtitle}<p class="text-sm text-gray-500">{subtitle}</p>{/if}
	</header>
	<div class="prose max-w-none"><slot /></div>
</section>
