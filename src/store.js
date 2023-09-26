import { writable } from 'svelte/store';

const defaultLocation = {
  lat: 42.44790335,
  lon: -76.4757855322,
  id: 'default',
  shortAddress: '306 Tower Road',
  fullAddress: '306 Tower Road, Ithaca, NY'
};

export const activeLocation = writable(defaultLocation);
export const locations = writable([defaultLocation]);