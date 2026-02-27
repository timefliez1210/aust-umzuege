export function floorLabel(floor: string | null): string {
	if (!floor) return 'EG';
	const labels: Record<string, string> = {
		'0': 'Erdgeschoss', '1': '1. OG', '2': '2. OG', '3': '3. OG',
		'4': '4. OG', '5': '5. OG', '-1': 'Keller'
	};
	return labels[floor] || `${floor}. OG`;
}

export function parseFloor(floor: string | null): number {
	if (!floor) return 0;
	const s = floor.trim();
	if (s === 'Erdgeschoss' || s === 'Hochparterre' || s === '0') return 0;
	if (s === 'Höher als 6. Stock') return 7;
	const m = s.match(/^(\d+)/);
	return m ? parseInt(m[1]) : 0;
}
