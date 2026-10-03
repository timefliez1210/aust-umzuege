/**
 * Shell-level panels that can be opened from anywhere (sidebar footer, "Mehr" sheet,
 * ⌘K). They used to be floating buttons, which collide with the phone tab bar.
 */
class Panels {
	notes = $state(false);
	feedback = $state(false);
	palette = $state(false);
	more = $state(false);
}

export const panels = new Panels();
