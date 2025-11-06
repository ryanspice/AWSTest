// This runs on the server. With adapter-static it runs at build time (prerender).
// If you switch to a Lambda SSR adapter, it’ll run on every request.
// import type { PageServerLoad } from './$types';

export const load = async ({ fetch }) => {
	const res = await fetch('https://worldtimeapi.org/api/timezone/America/Toronto');
	const time = res.ok ? await res.json() : { error: 'offline' };

	// Include some simple, cache-friendly data to demonstrate SSR hydration.
	return {
		time,
		builtAt: new Date().toISOString(),
	};
};
