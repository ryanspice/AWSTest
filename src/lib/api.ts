// Tiny runtime client for the API Gateway-backed Lambda behind /api/*

export type Ping = {
	ok: boolean;
	method?: string;
	path?: string;
	ts?: number;
	region?: string;
	functionName?: string;
	memory?: number;
	cold?: boolean;
	echo?: unknown;
};

export async function apiPing(signal?: AbortSignal): Promise<Ping> {
	const t0 = performance.now();
	const res = await fetch('/api/ping', { cache: 'no-store', signal });
	const t1 = performance.now();
	const data = (await res.json()) as Ping;
	return { ...data, echo: { latencyMs: Math.round(t1 - t0) } };
}

export async function apiEcho<T extends object>(body: T, signal?: AbortSignal): Promise<Ping> {
	const t0 = performance.now();
	const res = await fetch('/api/echo', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
		cache: 'no-store',
		signal
	});
	const t1 = performance.now();
	const data = (await res.json()) as Ping;
	return { ...data, echo: { body, latencyMs: Math.round(t1 - t0) } };
}
