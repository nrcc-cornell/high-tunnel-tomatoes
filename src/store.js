import { writable } from 'svelte/store';

export const activeLocation = writable(null);
export const locations = writable(null);
export const isLoadingLocation = writable(false);


// Spinner colors:
// #FF3E00 - red
// #40B3FF - blue
// #676778 - gray