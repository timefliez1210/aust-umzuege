// Global opener for the site-wide ContactFlow modal.
// Any component can call openContactFlow() to surface the picker, or
// openContactFlow("callback" | "message") to jump straight to a form step.

export type ContactFlowMode = null | 'picker' | 'callback' | 'message';

export const contactFlow = $state<{ mode: ContactFlowMode }>({ mode: null });

export function openContactFlow(mode: Exclude<ContactFlowMode, null> = 'picker'): void {
	contactFlow.mode = mode;
}

export function closeContactFlow(): void {
	contactFlow.mode = null;
}
