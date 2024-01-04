export default {
	async fetch(request, env, ctx) {
		let log = {
			url: request.url,
			method: request.method,
			headers: Object.fromEntries(request.headers),
		};
		await env.sendKlaviyo.send(log);
		return new Response('Success!');
	},
	async queue(batch, env) {
		let messages = JSON.stringify(batch.messages);
		console.log(`consumed from our queue: ${messages}`);
	},
};