import { derived } from 'svelte/store'

export default function (stores, callback, initial_value) {
	let guard

	return derived(stores, ($stores, set) => {
		const inner = guard = {}

		set(initial_value)
		Promise.resolve(callback($stores)).then(value => {
			if (guard === inner) {
				set(value)
			}
		})
	}, initial_value)
}