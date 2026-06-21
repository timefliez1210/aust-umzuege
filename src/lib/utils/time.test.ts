import { describe, it, expect } from 'vitest';
import { normalizeTime } from './time';

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
