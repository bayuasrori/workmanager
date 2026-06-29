import { drizzle } from 'drizzle-orm/postgres-js';
import type { SQL } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const client = postgres(env.DATABASE_URL, {
	// Neon auto-suspends compute when idle; keep the pool resilient to drops.
	prepare: false, // avoid "prepared statement does not exist" after a connection recycles
	max: 10, // max connections in pool
	idle_timeout: 20, // release idle conns so Neon can suspend cleanly
	max_lifetime: 60 * 30, // recycle before connections go stale
	connect_timeout: 15 // fail fast when Neon is unreachable
});

const drizzleDb = drizzle(client, { schema });

export const db = Object.assign(drizzleDb, {
	all: async <T = unknown>(query: SQL) => {
		const result = await drizzleDb.execute(query);
		return result as T[];
	},
	get: async <T = unknown>(query: SQL) => {
		const result = await drizzleDb.execute(query);
		return (result[0] ?? null) as T | undefined;
	}
});
