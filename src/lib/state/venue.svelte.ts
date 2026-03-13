const STORAGE_KEY = 'selected_venue_id';

function createVenueState() {
	let selectedVenueId = $state<string | null>(
		typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
	);

	return {
		get value() {
			return selectedVenueId;
		},
		set(id: string) {
			selectedVenueId = id;
			localStorage.setItem(STORAGE_KEY, id);
		}
	};
}

export const venueState = createVenueState();
