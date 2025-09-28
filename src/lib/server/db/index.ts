import { drizzle } from 'drizzle-orm/postgres-js';
import type { SQL } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const client = postgres(env.DATABASE_URL);

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
