import { webcrypto } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

if (!globalThis.crypto) {
	Object.defineProperty(globalThis, 'crypto', {
		value: webcrypto,
		configurable: true
	});
}

const {
	insertReturningMock,
	insertValuesMock,
	insertMock,
	updateReturningMock,
	updateWhereMock,
	updateSetMock,
	updateMock,
	deleteWhereMock,
	deleteMock,
	transactionMock,
	taskFindFirstMock,
	taskFindManyMock
} = vi.hoisted(() => {
	const insertReturningMock = vi.fn();
	const insertValuesMock = vi.fn(() => ({ returning: insertReturningMock }));
	const insertMock = vi.fn(() => ({ values: insertValuesMock }));
	const updateReturningMock = vi.fn();
	const updateWhereMock = vi.fn(() => ({ returning: updateReturningMock }));
	const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
	const updateMock = vi.fn(() => ({ set: updateSetMock }));
	const deleteWhereMock = vi.fn();
	const deleteMock = vi.fn(() => ({ where: deleteWhereMock }));
	const txDeleteWhereMock = vi.fn();
	const txDeleteMock = vi.fn(() => ({ where: txDeleteWhereMock }));
	const transactionMock = vi.fn(async (cb: (tx: { delete: typeof txDeleteMock }) => unknown) =>
		cb({ delete: txDeleteMock })
	);
	const taskFindFirstMock = vi.fn();
	const taskFindManyMock = vi.fn();
	return {
		insertReturningMock,
		insertValuesMock,
		insertMock,
		updateReturningMock,
		updateWhereMock,
		updateSetMock,
		updateMock,
		deleteWhereMock,
		deleteMock,
		transactionMock,
		taskFindFirstMock,
		taskFindManyMock
	};
});

vi.mock('../../db', () => ({
	db: {
		insert: insertMock,
		update: updateMock,
		delete: deleteMock,
		transaction: transactionMock,
		query: {
			task: {
				findFirst: taskFindFirstMock,
				findMany: taskFindManyMock
			}
		}
	}
}));

const { recordMock } = vi.hoisted(() => ({ recordMock: vi.fn() }));

vi.mock('../activity', () => ({
	activityService: {
		record: recordMock
	}
}));

import { taskService } from '../task';

describe('taskService.create', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		insertReturningMock.mockResolvedValue([{ id: '00000000-0000-0000-0000-000000000000' }]);
	});

	it('records activity when actorId and projectId are provided', async () => {
		const randomUUIDSpy = vi
			.spyOn(globalThis.crypto, 'randomUUID')
			.mockReturnValue('00000000-0000-0000-0000-000000000000');

		await taskService.create(
			{
				name: 'Onboard user',
				description: 'Finish onboarding',
				statusId: 'status-1',
				projectId: 'proj-1',
				assigneeId: 'user-2',
				startDate: new Date('2024-05-01T00:00:00Z'),
				endDate: null
			},
			{ actorId: 'user-1' }
		);

		expect(recordMock).toHaveBeenCalledWith({
			projectId: 'proj-1',
			userId: 'user-1',
			taskId: '00000000-0000-0000-0000-000000000000',
			type: 'TASK_CREATED',
			description: 'Task "Onboard user" dibuat',
			metadata: { taskId: '00000000-0000-0000-0000-000000000000' }
		});

		randomUUIDSpy.mockRestore();
	});

	it('skips activity record when actorId is missing', async () => {
		await taskService.create({
			name: 'Task without actor',
			description: 'No activity should be recorded',
			statusId: 'status-1',
			projectId: 'proj-1',
			assigneeId: null,
			startDate: null,
			endDate: null
		});

		expect(recordMock).not.toHaveBeenCalled();
	});
});

describe('taskService.update', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		updateReturningMock.mockResolvedValue([]);
	});

	it('records status change activity with diff metadata', async () => {
		taskFindFirstMock.mockResolvedValueOnce({
			id: 'task-1',
			name: 'Existing task',
			description: 'Old description',
			statusId: 'status-1',
			projectId: 'proj-1',
			assigneeId: 'user-2',
			startDate: null,
			endDate: null
		});

		updateReturningMock.mockResolvedValueOnce([
			{
				id: 'task-1',
				name: 'Existing task',
				description: 'Updated description',
				statusId: 'status-2',
				projectId: 'proj-1',
				assigneeId: 'user-2',
				startDate: null,
				endDate: null
			}
		]);

		await taskService.update(
			'task-1',
			{ description: 'Updated description', statusId: 'status-2' },
			{ actorId: 'user-1' }
		);

		expect(recordMock).toHaveBeenCalledWith({
			projectId: 'proj-1',
			userId: 'user-1',
			taskId: 'task-1',
			type: 'TASK_STATUS_CHANGED',
			description: 'Status task "Existing task" diperbarui',
			metadata: {
				changes: {
					description: { old: 'Old description', new: 'Updated description' },
					statusId: { old: 'status-1', new: 'status-2' }
				}
			}
		});
	});
});

describe('taskService.delete', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		deleteWhereMock.mockResolvedValue(undefined);
	});

	it('records delete activity when actorId provided', async () => {
		taskFindFirstMock.mockResolvedValueOnce({
			id: 'task-1',
			name: 'Task to delete',
			projectId: 'proj-9'
		});

		await taskService.delete('task-1', { actorId: 'user-3' });

		expect(recordMock).toHaveBeenCalledWith({
			projectId: 'proj-9',
			userId: 'user-3',
			taskId: 'task-1',
			type: 'TASK_DELETED',
			description: 'Task "Task to delete" dihapus',
			metadata: { taskId: 'task-1' }
		});
	});
});
