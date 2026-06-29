export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	kind: ToastKind;
	message: string;
}

const items = $state<Toast[]>([]);
let seq = 0;

function push(kind: ToastKind, message: string, ms = 4000): number {
	const id = ++seq;
	items.push({ id, kind, message });
	if (ms > 0) {
		setTimeout(() => dismiss(id), ms);
	}
	return id;
}

function dismiss(id: number): void {
	const idx = items.findIndex((t) => t.id === id);
	if (idx !== -1) items.splice(idx, 1);
}

export const toasts = {
	get items(): Toast[] {
		return items;
	},
	push,
	dismiss,
	success(message: string, ms?: number) {
		return push('success', message, ms);
	},
	error(message: string, ms?: number) {
		return push('error', message, ms);
	},
	info(message: string, ms?: number) {
		return push('info', message, ms);
	}
};

const FLASH_KEY = 'papanin:flash-toast';

export function setFlashToast(kind: ToastKind, message: string): void {
	if (typeof sessionStorage === 'undefined') return;
	try {
		sessionStorage.setItem(FLASH_KEY, JSON.stringify({ kind, message }));
	} catch {
		// sessionStorage unavailable (private mode / disabled) — ignore silently.
	}
}

export function consumeFlashToast(): { kind: ToastKind; message: string } | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		const raw = sessionStorage.getItem(FLASH_KEY);
		if (!raw) return null;
		sessionStorage.removeItem(FLASH_KEY);
		return JSON.parse(raw) as { kind: ToastKind; message: string };
	} catch {
		return null;
	}
}
