import { writable } from 'svelte/store';

export const globalIsLoading = writable(false);

/**
 * Tracks the pathname being navigated to.
 * Set on beforeNavigate, cleared on afterNavigate (after DOM update).
 * Unlike $navigating, this stays truthy until page fully renders.
 */
export const navigationTarget = writable<string | null>(null);
