export default {
	async scheduled(event, env, ctx) {
		async function logCustomerNames() {
			const query = `
			SELECT 
				u.first_name AS 'First Name',
				u.last_name AS 'Last Name',
				u.email AS EMAIL
			FROM
				ABC u
		`;
			const { results } = await env.DB.prepare(query).all();

			const batch = results.map((value) => ({
				body: JSON.stringify(value),
			}));
			
			await env.queue.sendBatch(batch);
		}
		await logCustomerNames();
	},
	async queue(batch, env) {
		for (const msg of batch.messages) {
			console.log(msg)
			const customer = JSON.parse(msg);
			
			const url = 'https://a.klaviyo.com/api/profiles/';
			const options = {
				method: 'POST',
				headers: {
					accept: 'application/json',
					revision: '2023-10-15',
					'content-type': 'application/json',
					Authorization: 'Klaviyo-API-Key pk_a18e2b362c9309f19cc25812f0379d4960',
				},
				body: JSON.stringify({
					data: {
						type: 'profile',
						attributes: {
							email: customer['EMAIL'],
							first_name: customer['First Name'],
							last_name: customer['Last Name'],
							properties: { store: 2, acu_customer_id: 2 },
						},
					},
				}),
			};
			try {
				const response = await fetch(url, options);
				const json = await response.json();
				console.log(json);
				if (json.errors && json.errors[0].code === 'duplicate_profile') {
					// Code for getting profile and then getting unique identifier (ID)
					const email = customer['EMAIL'];
					const filter = `filter=equals(email,"${email}")`;
					const url2 = `https://a.klaviyo.com/api/profiles?${filter}`;
					const options2 = {
						method: 'GET',
						headers: {
							accept: 'application/json',
							revision: '2023-10-15',
							Authorization: 'Klaviyo-API-Key pk_a18e2b362c9309f19cc25812f0379d4960',
						},
					};
					let userId;
					try {
						const res2 = await fetch(url2, options2);
						const json2 = await res2.json();
						userId = json2.data[0].id;
					} catch (err) {
						console.error('error:' + err);
					}
					if (userId) {
						// Code for updating profile by ID
						const url3 = `https://a.klaviyo.com/api/profiles/${userId}`;

						const options3 = {
							method: 'PATCH',
							headers: {
								accept: 'application/json',
								revision: '2023-10-15',
								'content-type': 'application/json',
								Authorization: 'Klaviyo-API-Key pk_a18e2b362c9309f19cc25812f0379d4960',
							},
							body: JSON.stringify({
								data: {
									type: 'profile',
									id: `${userId}`,
									attributes: {
										email: customer['EMAIL'],
										first_name: customer['First Name'],
										last_name: customer['Last Name'],
										properties: { store: 2, acu_customer_id: 2 },
									},
								},
							}),
						};
						const response3 = await fetch(url3, options3);
						const json3 = await response3.json();
						console.log(json3);
					}
				}
			} catch (error) {
				console.error('Error: ' + error);
			}
		}
	}

};
