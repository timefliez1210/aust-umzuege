import { describe, it, expect } from 'vitest';
import { normalizeTime, breakHoursToMinutes, breakMinutesToHours } from './time';

describe('normalizeTime', () => {
	it('accepts the canonical colon form', () => {
		expect(normalizeTime('07:30')).toBe('07:30');
		expect(normalizeTime('7:30')).toBe('07:30');
		expect(normalizeTime('17:05')).toBe('17:05');
	});

	it('accepts the decimal-keypad forms movers actually type', () => {
		expect(normalizeTime('7.30')).toBe('07:30');
		expect(normalizeTime('7,30')).toBe('07:30');
		expect(normalizeTime('07.30')).toBe('07:30');
		expect(normalizeTime('7h30')).toBe('07:30');
		expect(normalizeTime('7 30')).toBe('07:30');
	});

	it('accepts run-together digits', () => {
		expect(normalizeTime('730')).toBe('07:30');
		expect(normalizeTime('0730')).toBe('07:30');
		expect(normalizeTime('1730')).toBe('17:30');
	});

	it('accepts a bare hour', () => {
		expect(normalizeTime('7')).toBe('07:00');
		expect(normalizeTime('17')).toBe('17:00');
	});

	it('pads a single-digit minute as tens ("7.3" → half past)', () => {
		expect(normalizeTime('7.3')).toBe('07:30');
	});

	it('trims surrounding whitespace', () => {
		expect(normalizeTime('  8:00 ')).toBe('08:00');
	});

	it('rejects empty and nonsense', () => {
		expect(normalizeTime('')).toBeNull();
		expect(normalizeTime('   ')).toBeNull();
		expect(normalizeTime('abc')).toBeNull();
		expect(normalizeTime('25:00')).toBeNull();
		expect(normalizeTime('7:99')).toBeNull();
	});
});

describe('breakHoursToMinutes', () => {
	it('converts clean quarter/half hours to exact minutes', () => {
		expect(breakHoursToMinutes('0.25')).toBe(15);
		expect(breakHoursToMinutes('0.5')).toBe(30);
		expect(breakHoursToMinutes('0.75')).toBe(45);
		expect(breakHoursToMinutes('1')).toBe(60);
		expect(breakHoursToMinutes('1.5')).toBe(90);
	});

	it('rounds messy thirds to the nearest minute', () => {
		// 0.33 × 60 = 19.8 → 20 (the closest clean value)
		expect(breakHoursToMinutes('0.33')).toBe(20);
		// 0.66 × 60 = 39.6 → 40
		expect(breakHoursToMinutes('0.66')).toBe(40);
		// 0.67 × 60 = 40.2 → 40
		expect(breakHoursToMinutes('0.67')).toBe(40);
	});

	it('accepts a German decimal comma and surrounding whitespace', () => {
		expect(breakHoursToMinutes('0,25')).toBe(15);
		expect(breakHoursToMinutes('  0.5 ')).toBe(30);
	});

	it('accepts a numeric argument', () => {
		expect(breakHoursToMinutes(0.25)).toBe(15);
		expect(breakHoursToMinutes(1)).toBe(60);
	});

	it('treats empty, negative and garbage as 0', () => {
		expect(breakHoursToMinutes('')).toBe(0);
		expect(breakHoursToMinutes('   ')).toBe(0);
		expect(breakHoursToMinutes(null)).toBe(0);
		expect(breakHoursToMinutes(undefined)).toBe(0);
		expect(breakHoursToMinutes('abc')).toBe(0);
		expect(breakHoursToMinutes('-1')).toBe(0);
	});
});

describe('breakMinutesToHours', () => {
	it('renders stored minutes as a trimmed decimal-hours string', () => {
		expect(breakMinutesToHours(15)).toBe('0.25');
		expect(breakMinutesToHours(20)).toBe('0.33');
		expect(breakMinutesToHours(30)).toBe('0.5');
		expect(breakMinutesToHours(45)).toBe('0.75');
		expect(breakMinutesToHours(60)).toBe('1');
		expect(breakMinutesToHours(90)).toBe('1.5');
	});

	it('renders 0 / null / undefined as an empty string (placeholder shows)', () => {
		expect(breakMinutesToHours(0)).toBe('');
		expect(breakMinutesToHours(null)).toBe('');
		expect(breakMinutesToHours(undefined)).toBe('');
	});

	it('round-trips every whole-minute value 1–120 exactly', () => {
		// The core guarantee: display → re-parse must not drift.
		for (let m = 1; m <= 120; m++) {
			expect(breakHoursToMinutes(breakMinutesToHours(m))).toBe(m);
		}
	});
});
