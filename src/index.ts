export interface Env {
	p6: D1Database;
}

async function queryDatabase(db: D1Database) {
	const { results } = await db.prepare('SELECT * FROM users').all();
	return results;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const data = await queryDatabase(env.p6);
		return Response.json({ message: 'Hello, World! 3', dbData: data });
	},
	// async fetch(request, env, ctx): Promise<Response> {
	// 	const url = new URL(request.url);

	// 	switch (url.pathname) {
	// 		case '/message':
	// 			return new Response('Hello, World!');
	// 		case '/random':
	// 			return new Response(crypto.randomUUID());
	// 		case '/health':
	// 			return Response.json({
	// 				status: 'ok',
	// 				timestamp: new Date().toISOString(),
	// 			});
	// 		case '/users': {
	// 			const data = await queryDatabase(env.p6);
	// 			return Response.json({ message: 'Hello, World! 3', dbData: data });
	// 		}
	// 		default:
	// 			return new Response('Not Found', { status: 404 });
	// 	}
	// },
} satisfies ExportedHandler<Env>;