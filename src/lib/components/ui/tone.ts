/** Semantic colour roles. Everything coloured in the console picks one of these. */
export type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'accent' | 'info';

/** Text colour per tone. */
export const toneText: Record<Tone, string> = {
	neutral: 'text-muted',
	ok: 'text-ok',
	warn: 'text-warn',
	danger: 'text-danger',
	accent: 'text-accent-text',
	info: 'text-info'
};

/** Solid fill per tone (dots, bars). */
export const toneFill: Record<Tone, string> = {
	neutral: 'bg-bar-strong',
	ok: 'bg-ok',
	warn: 'bg-warn',
	danger: 'bg-danger',
	accent: 'bg-accent',
	info: 'bg-info'
};

/** Outlined chip per tone. */
export const toneChip: Record<Tone, string> = {
	neutral: 'border-line-strong text-muted',
	ok: 'border-ok/45 bg-ok/10 text-ok',
	warn: 'border-warn/45 bg-warn/10 text-warn',
	danger: 'border-danger/45 bg-danger/10 text-danger',
	accent: 'border-accent/55 bg-accent/12 text-accent-text',
	info: 'border-info/45 bg-info/10 text-info'
};
