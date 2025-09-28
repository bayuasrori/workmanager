import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityRecordInput } from '../activity';

if (!globalThis.crypto) {
	Object.defineProperty(globalThis, 'crypto', {
		value: webcrypto,
		configurable: true
	});
}

const valuesMock = vi.fn();
const insertMock = vi.fn(() => ({ values: valuesMock }));
const findManyMock = vi.fn();
const allMock = vi.fn();

vi.mock('../../db', () => ({
	db: {
		insert: insertMock,
		query: {
			activity: {
				findMany: findManyMock
			}
		},
		all: allMock
	}
}));

// Import after mocks to apply them
import { activityService } from '../activity';

describe('activityService.record', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		valuesMock.mockResolvedValue(undefined);
		findManyMock.mockResolvedValue([]);
		allMock.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns early when projectId is missing', async () => {
		const randomUUIDSpy = vi.spyOn(globalThis.crypto, 'randomUUID');
		await activityService.record({ userId: 'user-1', type: 'TASK_CREATED' });
		expect(valuesMock).not.toHaveBeenCalled();
		expect(randomUUIDSpy).not.toHaveBeenCalled();
	});

	it('returns early when userId is missing', async () => {
		await activityService.record({ projectId: 'proj-1', type: 'TASK_CREATED' });
		expect(valuesMock).not.toHaveBeenCalled();
	});

	it('persists activity with expected payload', async () => {
		vi.useFakeTimers();
		const now = new Date('2024-01-01T00:00:00Z');
		vi.setSystemTime(now);
		const randomUUIDSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('activity-uuid');

		const payload: ActivityRecordInput = {
			projectId: 'proj-1',
			userId: 'user-1',
			taskId: 'task-1',
			type: 'TASK_CREATED',
			description: 'Task created',
			metadata: { foo: 'bar' }
		};

		await activityService.record(payload);

		expect(insertMock).toHaveBeenCalledWith(expect.anything());
		expect(valuesMock).toHaveBeenCalledTimes(1);
		expect(valuesMock).toHaveBeenCalledWith({
			id: 'activity-uuid',
			projectId: 'proj-1',
			taskId: 'task-1',
			userId: 'user-1',
			type: 'TASK_CREATED',
			description: 'Task created',
			metadata: JSON.stringify({ foo: 'bar' }),
			createdAt: now
		});

		randomUUIDSpy.mockRestore();
		vi.useRealTimers();
	});
});

describe('activityService.getDailyActivity', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		allMock.mockResolvedValue([{ date: '2024-01-01', count: 5 }]);
	});

	it('returns an empty array when projectId is falsy', async () => {
		const result = await activityService.getDailyActivity();
		expect(result).toEqual([]);
		expect(allMock).not.toHaveBeenCalled();
	});

	it('returns results from the database when projectId is provided', async () => {
		const result = await activityService.getDailyActivity('proj-1');
		expect(result).toEqual([{ date: '2024-01-01', count: 5 }]);
		expect(allMock).toHaveBeenCalledTimes(1);
	});
});
