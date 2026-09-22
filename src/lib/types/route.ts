/**
 * Umzugsroute — the driven round trip for an inquiry.
 *
 * Returned by `GET /api/v1/inquiries/{id}/route`. The waypoints are built
 * server-side (the depot address is backend config), so the map and the KVA's
 * Fahrkostenpauschale always describe the same trip.
 */

/** One driven leg between two consecutive waypoints. */
export interface RouteLeg {
	/** German role label of the leg's start: "Lager" | "Auszug" | "Zwischenstopp" | "Einzug". */
	from_label: string;
	/** German role label of the leg's end. */
	to_label: string;
	from_address: string;
	to_address: string;
	distance_km: number;
	duration_minutes: number;
	/** GeoJSON `[lng, lat]` pairs for this leg only — concatenate all legs for the full polyline. */
	geometry?: [number, number][];
}

/** Full round trip: Lager → Auszug → [Zwischenstopp] → Einzug → Lager. */
export interface InquiryRoute {
	total_distance_km: number;
	total_duration_minutes: number;
	legs: RouteLeg[];
}

/**
 * Shorten a full address to just its street line for the leg breakdown.
 *
 * Called by: DetailsSection route card.
 * Purpose: the breakdown reads as "Borsigstr 6 → Steinbergstr. 4 — 4,1 km"; repeating
 *          "31135 Hildesheim" on every row buries the number Alex is looking for.
 */
export function shortAddress(address: string): string {
	return address.split(",")[0].trim();
}
