import { webcrypto } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

if (!globalThis.crypto) {
	Object.defineProperty(globalThis, 'crypto', {
		value: webcrypto,
		configurable: true
	});
}

const insertValuesMock = vi.fn();
const insertMock = vi.fn(() => ({ values: insertValuesMock }));
const updateWhereMock = vi.fn();
const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
const updateMock = vi.fn(() => ({ set: updateSetMock }));
const allMock = vi.fn();
const getMock = vi.fn();

vi.mock('../../db', () => ({
	db: {
		insert: insertMock,
		update: updateMock,
		delete: vi.fn(),
		select: vi.fn(),
		all: allMock,
		get: getMock
	}
}));

import { userService } from '../user';

describe('userService.create', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		insertValuesMock.mockResolvedValue(undefined);
	});

	it('normalizes email and assigns id/createdAt', async () => {
		vi.useFakeTimers();
		const now = new Date('2024-03-15T12:00:00Z');
		vi.setSystemTime(now);
		const randomUUIDSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('user-uuid');

		await userService.create({
			age: 27,
			username: 'Alice',
			email: '  User@Example.COM  ',
			passwordHash: 'hash',
			isAdmin: true
		});

		expect(insertMock).toHaveBeenCalledWith(expect.anything());
		expect(insertValuesMock).toHaveBeenCalledWith({
			age: 27,
			username: 'Alice',
			email: 'user@example.com',
			passwordHash: 'hash',
			isAdmin: true,
			id: 'user-uuid',
			createdAt: now
		});

		randomUUIDSpy.mockRestore();
		vi.useRealTimers();
	});
});

describe('userService.update', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		updateWhereMock.mockResolvedValue(undefined);
	});

	it('normalizes provided email before update', async () => {
		await userService.update('user-1', {
			email: '  SECOND@Example.COM '
		});

		expect(updateSetMock).toHaveBeenCalledWith({
			email: 'second@example.com'
		});
		expect(updateWhereMock).toHaveBeenCalledTimes(1);
	});
});

describe('userService.getUsersWithMembership', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		allMock.mockResolvedValue([
			{
				id: 'user-1',
				username: 'alice',
				email: 'alice@example.com',
				created_at: new Date('2024-04-01T00:00:00Z'),
				membership_type: 'pro'
			}
		]);
		getMock.mockResolvedValue({ total: 15 });
	});

	it('returns paginated users with metadata', async () => {
		const result = await userService.getUsersWithMembership(2, 5);

		expect(allMock).toHaveBeenCalledTimes(1);
		expect(getMock).toHaveBeenCalledTimes(1);
		expect(result).toEqual({
			users: [
				{
					id: 'user-1',
					username: 'alice',
					email: 'alice@example.com',
					created_at: new Date('2024-04-01T00:00:00Z'),
					membership_type: 'pro'
				}
			],
			pagination: {
				currentPage: 2,
				totalPages: 3,
				totalItems: 15,
				itemsPerPage: 5,
				hasNext: true,
				hasPrev: true
			}
		});
	});
});
